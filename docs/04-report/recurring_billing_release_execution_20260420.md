# Recurring Billing Release Execution

Date: 2026-04-20
Target project ref: `xvmpvzldezpoxxsarizm`
Scope: recovery-state migration, Edge Function deploy, webhook production verification, manual reconcile verification

## Local Verification Result

Completed locally before production:

- `npx vitest run tests/security/billingHotfixContracts.spec.ts tests/security/billingRecoveryContracts.spec.ts tests/security/billingOpsContracts.spec.ts`
  - Result: pass
- `npm run build`
  - Result: pass
  - Residual warning: `@supabase/supabase-js` wrapper export warning 2건, 기존과 동일
- `npx supabase --version`
  - Result: `2.92.1`
- `npx supabase functions deploy --help`
  - Result: deploy syntax confirmed

Not executed from this environment:

- production SQL apply
- production function deploy
- real PortOne webhook round-trip
- real `reconcile-payment-intent` invocation against production

Reason:

- production DB write and Supabase deploy require live credentials and network-backed operator approval
- webhook verification requires a real PortOne event or replay

## Production Preconditions

- migration `20260420170000_expand_payment_intent_recovery_states.sql` must be applied before function deploy
- `PORTONE_API_SECRET` exists in Supabase secrets
- `SUPABASE_SERVICE_ROLE_KEY` exists in Supabase secrets
- PortOne webhook endpoint still points to `payment-webhook`
- recurring scheduler or caller can still invoke `charge-subscription` with service-role bearer
- operator can replay webhook from PortOne dashboard or trigger a real payment

## Execution Order

1. Apply migration
2. Verify constraint
3. Deploy `issue-billing-key`
4. Deploy `payment-webhook`
5. Deploy `verify-payment`
6. Deploy `charge-subscription`
7. Deploy `reconcile-payment-intent`
8. Run production webhook checks
9. If needed, run manual reconcile on a sample `pending` or `sync_required`

## Production Commands

### 1. Apply migration

Production note:

- do not use `supabase db push`
- use reviewed SQL runner or approved migration execution path

SQL to apply:

```sql
ALTER TABLE public.payment_intents
  DROP CONSTRAINT IF EXISTS payment_intents_status_check;

ALTER TABLE public.payment_intents
  ADD CONSTRAINT payment_intents_status_check
  CHECK (status IN ('pending', 'sync_required', 'paid', 'failed', 'cancelled'));
```

Success:

- SQL applies without error

Failure:

- any constraint error or lock timeout

Rollback point:

- stop here
- old functions remain safe with the expanded constraint because this change is additive

### 2. Verify constraint

Run:

```sql
select
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conname = 'payment_intents_status_check';
```

Success:

- result includes `('pending', 'sync_required', 'paid', 'failed', 'cancelled')`

Failure:

- `sync_required` missing

Rollback point:

- do not deploy functions

### 3. Deploy Edge Functions

PowerShell:

```powershell
$projectRef = "xvmpvzldezpoxxsarizm"

npx supabase functions deploy issue-billing-key --project-ref $projectRef --use-api
npx supabase functions deploy payment-webhook --project-ref $projectRef --use-api
npx supabase functions deploy verify-payment --project-ref $projectRef --use-api
npx supabase functions deploy charge-subscription --project-ref $projectRef --use-api
npx supabase functions deploy reconcile-payment-intent --project-ref $projectRef --use-api
```

Success:

- each command exits `0`
- deployed function version updates in Supabase dashboard

Failure:

- deploy command exits non-zero
- `payment-webhook` or `charge-subscription` loses `verify_jwt = false`

Rollback point:

- if `issue-billing-key` is deployed but `payment-webhook` is not, complete the remaining deploys immediately before re-opening payment traffic
- if `charge-subscription` deploy fails, keep recurring scheduler paused until redeploy succeeds
- if `reconcile-payment-intent` deploy fails, core billing can still proceed but manual recovery remains unavailable

Operator check after deploy:

- confirm `payment-webhook` and `charge-subscription` still run with `verify_jwt = false`

### 4. Watch recoverable backlog

Run:

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

Success:

- backlog is empty before release or each row has an explicit operator owner

Failure:

- unknown old rows remain and operator cannot explain them

Rollback point:

- hold recurring release until old unresolved rows are understood

## Webhook Production Validation Checklist

### Scenario A. Initial activation direct success

Steps:

1. Trigger one real initial recurring activation
2. Capture returned `paymentId`
3. Query `payment_intents`
4. Query `subscription_payments`
5. Confirm subscription row active

Success:

- `issue-billing-key` returns `200`
- `payment_intents.status = 'paid'`
- `subscription_payments.portone_payment_id = payment_id`
- target subscription is active

Failure:

- `payment_intents` remains `pending` or `sync_required`
- `subscription_payments` missing

Rollback point:

- pause further initial activations
- inspect `system_logs`
- if paid in PortOne but unsynced in DB, move to Scenario C

### Scenario B. Recoverable activation then webhook close

Steps:

1. Use or capture a case where `issue-billing-key` returns `202 recoverable`
2. Query `payment_intents` immediately
3. Replay or wait for webhook
4. Query the same `payment_id` again

Success:

- initial state is `pending` with `VERIFY_PENDING` or `sync_required`
- later state becomes `paid` with `PAID`
- `system_logs` contains `edge-function:payment-webhook` and `Webhook processed`

Failure:

- webhook arrives but row stays `pending` or `sync_required`
- webhook logs show persistence failure

Rollback point:

- pause new recurring activations if this reproduces more than once
- use Scenario C for manual recovery on the sample row

Observation query:

```sql
select payment_id, status, portone_status, resolved_at
from payment_intents
where payment_id = '<payment_id>';
```

Log query:

```sql
select source, level, message, meta, created_at
from system_logs
where source in ('edge-function:issue-billing-key', 'edge-function:payment-webhook')
order by created_at desc
limit 20;
```

### Scenario C. Manual reconcile of `pending` or `sync_required`

PowerShell:

```powershell
$projectRef = "xvmpvzldezpoxxsarizm"
$headers = @{
  Authorization = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
  "Content-Type" = "application/json"
}
$body = @{ paymentId = "rsubf_xxxxx" } | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://$projectRef.supabase.co/functions/v1/reconcile-payment-intent" `
  -Headers $headers `
  -Body $body
```

Success:

- PortOne `PAID` with matching amount becomes `paid`
- subscription persistence completes
- `subscription_payments.portone_payment_id` exists

Failure:

- returns `409` with `sync_required`
- returns `502` due PortOne fetch failure
- returns `403` due wrong bearer

Rollback point:

- do not manually edit subscription rows first
- capture `payment_id`, response body, and `system_logs`
- if repeated `sync_required`, escalate with persistence error details

Post-check query:

```sql
select
  pi.payment_id,
  pi.payment_context,
  pi.status,
  pi.portone_status,
  pi.expected_amount,
  sp.id as subscription_payment_id,
  sp.status as subscription_payment_status,
  sp.subscription_id
from payment_intents pi
left join subscription_payments sp
  on sp.portone_payment_id = pi.payment_id
where pi.payment_id = '<payment_id>';
```

### Scenario D. Recurring persistence failure stays out of next charge target

Steps:

1. Identify a real recurring payment that lands in `sync_required`
2. Query the subscription row
3. Confirm the scheduler will not pick it up again

Success:

- `payment_intents.status = 'sync_required'`
- `auto_renew = false`
- `cancel_at_period_end = true`
- `cancelled_reason = 'billing_sync_required'`

Failure:

- row is `sync_required` but subscription still eligible for next billing

Rollback point:

- pause recurring charge runner
- reconcile or manually repair the affected subscription before resuming

## Result Record Template

Fill this during production.

```text
Release start:
Operator:
Project ref: xvmpvzldezpoxxsarizm

Migration applied:
Constraint verified:

Function deploy:
- issue-billing-key:
- payment-webhook:
- verify-payment:
- charge-subscription:
- reconcile-payment-intent:

Scenario A result:
- paymentId:
- final payment_intents.status:
- subscription synced:

Scenario B result:
- paymentId:
- initial status:
- webhook final status:

Scenario C result:
- paymentId:
- reconcile response:
- final status:

Scenario D result:
- paymentId:
- subscription excluded from rebill:

Rollback used:
Open issues:
Release end:
```
