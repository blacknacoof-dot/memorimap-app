# Recurring Billing Ops Runbook

Date: 2026-04-20
Scope: initial recurring activation recovery, recurring batch sync recovery, webhook production validation

## Release Gate

Do not deploy the recovery-state functions before the `payment_intents` status migration is applied.

Required DB order:

1. `20260403110000_add_payment_intents.sql`
2. `20260416090000_add_recurring_subscription_fields.sql`
3. `20260420170000_expand_payment_intent_recovery_states.sql`

The third migration is the hard gate for this PR. The updated functions now write `sync_required`, so deploying code first can fail on the old `payment_intents_status_check` constraint.

Production note:

- Do not use `supabase db push` for production in this project.
- Apply the migration through the reviewed migration path or Dashboard SQL runner, then confirm the constraint before function deploy.

Constraint verification query:

```sql
select
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conname = 'payment_intents_status_check';
```

Expected result must include:

```sql
CHECK (status IN ('pending', 'sync_required', 'paid', 'failed', 'cancelled'))
```

## Function Deploy Order

Deploy in this order:

1. `issue-billing-key`
2. `payment-webhook`
3. `verify-payment`
4. `charge-subscription`
5. `reconcile-payment-intent`

Reasoning:

- `issue-billing-key` is the first writer of `pending` and `sync_required` for initial activation.
- `payment-webhook` must understand and close those states before new production traffic hits them.
- `verify-payment` should be aligned on the same enum handling before any mixed recovery path is exercised.
- `charge-subscription` should be last because it can emit new `sync_required` rows during recurring billing.
- `reconcile-payment-intent` is operational tooling and can be deployed after the core writers/readers are aligned.

Suggested deploy commands:

```powershell
npx supabase functions deploy issue-billing-key
npx supabase functions deploy payment-webhook
npx supabase functions deploy verify-payment
npx supabase functions deploy charge-subscription
npx supabase functions deploy reconcile-payment-intent
```

## Pre-Deploy Checks

- `PORTONE_API_SECRET` is present in Supabase Edge Function secrets.
- `SUPABASE_SERVICE_ROLE_KEY` is present.
- PortOne webhook endpoint still targets the current `payment-webhook` URL.
- Cron or external caller for `charge-subscription` still uses the service-role bearer contract.
- No unresolved production `payment_intents.status in ('pending', 'sync_required')` remain from an older incompatible schema.

Backlog query:

```sql
select
  payment_id,
  payment_context,
  status,
  portone_status,
  expected_amount,
  created_at,
  resolved_at
from payment_intents
where status in ('pending', 'sync_required')
order by created_at desc
limit 100;
```

## Production Webhook Validation

Minimum scenarios:

1. Initial activation success without recovery
2. Initial activation returns recoverable `202`, then webhook closes it to `paid`
3. Recurring charge hits persistence failure and lands in `sync_required`
4. Manual reconcile closes a real `sync_required` row to `paid`

### Scenario 1. Initial activation direct success

Expected observations:

- `issue-billing-key` returns `200`
- `payment_intents.status = 'paid'`
- `subscription_payments.portone_payment_id = payment_id`
- subscription row becomes `active`

### Scenario 2. Browser sees recoverable pending, webhook closes later

Target outcome:

- user can temporarily see failure or pending, but DB remains recoverable
- webhook later closes the same `payment_id`

Observe:

```sql
select payment_id, status, portone_status, resolved_at
from payment_intents
where payment_id = '<payment_id>';
```

Expected progression:

1. `pending` with `VERIFY_PENDING` or `sync_required`
2. later `paid` with `PAID`

Also check:

```sql
select source, level, message, meta, created_at
from system_logs
where source in ('edge-function:issue-billing-key', 'edge-function:payment-webhook')
order by created_at desc
limit 20;
```

Webhook success indicators:

- `source = edge-function:payment-webhook`
- `message = Webhook processed`
- `meta.action = synced:facility_subscription` or `synced:personal_subscription`

### Scenario 3. Recurring batch persistence failure

Expected observations right after failure:

- `payment_intents.status = 'sync_required'`
- subscription stays out of the next auto-charge target
- `auto_renew = false`
- `cancel_at_period_end = true`
- `cancelled_reason = 'billing_sync_required'`
- `last_payment_error` contains `SYNC_REQUIRED`

Check facility:

```sql
select
  id,
  status,
  auto_renew,
  cancel_at_period_end,
  cancelled_reason,
  retry_count,
  last_payment_error,
  next_billing_date
from facility_subscriptions
where id = '<subscription_id>';
```

Check personal:

```sql
select
  user_id,
  status,
  auto_renew,
  cancel_at_period_end,
  cancelled_reason,
  retry_count,
  last_payment_error,
  expires_at
from user_subscriptions
where user_id = '<user_id>';
```

### Scenario 4. Manual reconcile after `sync_required`

Preferred order:

1. Re-send the webhook from PortOne Dashboard if available
2. If webhook replay is unavailable or already exhausted, invoke `reconcile-payment-intent`

Invocation contract:

```json
{
  "paymentId": "rsubf_xxxxx"
}
```

Expected outcomes:

- if PortOne says `PAID` and amount matches:
  - subscription persistence runs again
  - `payment_intents.status` becomes `paid`
  - recurring flags are restored by shared persistence
- if PortOne says `FAILED` or `CANCELLED`:
  - `payment_intents` closes to the final failure state
- if PortOne still says non-final status:
  - `payment_intents` remains `pending`

## Observation Points

Primary tables:

- `payment_intents`
- `subscription_payments`
- `facility_subscriptions`
- `user_subscriptions`
- `system_logs`

What to watch:

- `payment_intents.status`
- `payment_intents.portone_status`
- `payment_intents.resolved_at`
- `subscription_payments.portone_payment_id`
- `facility_subscriptions.auto_renew`
- `facility_subscriptions.cancel_at_period_end`
- `facility_subscriptions.cancelled_reason`
- `user_subscriptions.auto_renew`
- `user_subscriptions.cancel_at_period_end`
- `user_subscriptions.cancelled_reason`

## Manual Recovery Procedure

Use this order. Do not manually edit subscription rows first.

1. Identify the `payment_id` from `payment_intents` or `system_logs`.
2. Confirm the PortOne payment status for that exact `payment_id`.
3. If PortOne status is non-final, leave the row as `pending`.
4. If PortOne status is `PAID`, prefer webhook replay.
5. If webhook replay is not possible, invoke `reconcile-payment-intent`.
6. Re-check `payment_intents`, `subscription_payments`, and the subscription row.
7. Only if reconciliation still fails, escalate for data repair with the captured `payment_id`, `payment_context`, and persistence error.

Read-only escalation query:

```sql
select
  pi.payment_id,
  pi.payment_context,
  pi.status,
  pi.portone_status,
  pi.user_id,
  pi.facility_id,
  pi.plan_id,
  pi.expected_amount,
  sp.id as subscription_payment_id,
  sp.status as subscription_payment_status,
  sp.subscription_id,
  sp.user_id as subscription_payment_user_id
from payment_intents pi
left join subscription_payments sp
  on sp.portone_payment_id = pi.payment_id
where pi.payment_id = '<payment_id>';
```

## Exit Criteria

This PR is operationally ready when all of the following are true:

- migration constraint is confirmed before function deploy
- all five functions are deployed in order
- one real initial activation reaches `paid`
- one recoverable activation is closed by webhook or manual reconcile
- one `sync_required` recurring case is shown to stay out of the next auto-charge target
