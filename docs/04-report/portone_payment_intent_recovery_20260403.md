# PortOne Payment Intent Recovery Report

Date: 2026-04-03
Commit: `c1c132a`
Production deployment: `dpl_84KKEoMvnVVmCoDC56yYeSGkV32w`

## Summary

This update added a `payment_intents` mapping layer so subscription payments can be recovered even if the browser closes before the client completes `verify-payment`.

The flow is now:

1. Client generates `paymentId`
2. Client calls `register-payment-intent`
3. Server stores `payment_intents`
4. PortOne payment window opens
5. `verify-payment` or `payment-webhook` resolves the payment using the stored metadata
6. Subscription rows and `subscription_payments` are updated

## Implemented Scope

- Added `payment_intents` table
- Added `register-payment-intent` Edge Function
- Updated subscription clients to register intent before payment
- Updated `verify-payment` to read and close payment intents
- Updated `payment-webhook` to recover subscription payments using payment intents
- Kept reservation payment handling as-is

## Verification Results

### Production webhook verification - 2026-04-08

Final status: PASS

- Test payment:
  - `payment_id`: `sub_mnpds2xg_dw6ov7`
  - `payment_context`: `facility_subscription`
  - `plan_id`: `BASIC`
  - `expected_amount`: `49000`

- `payment_intents`
  - `status`: `paid`
  - `portone_status`: `PAID`
  - `expected_amount`: `49000`
  - `plan_id`: `BASIC`
  - `resolved_at`: `2026-04-08 01:40:48.179+00`

- `subscription_payments`
  - `portone_payment_id`: `sub_mnpds2xg_dw6ov7`
  - `status`: `completed`
  - `amount`: `49000`
  - `payment_context`: `facility`
  - `paid_at`: `2026-04-08 01:40:47.21+00`
  - `billing_period_start`: `2026-04-08`
  - `billing_period_end`: `2026-05-08`

- `system_logs`
  - `message`: `Webhook processed`
  - `source`: `edge-function:payment-webhook`
  - `eventType`: `Transaction.Paid`
  - `paymentId`: `sub_mnpds2xg_dw6ov7`
  - `portoneStatus`: `PAID`
  - `action`: `synced:facility_subscription`

- Additional webhook behavior:
  - `Transaction.Ready` was received first and ignored as `ignored:status_READY`.
  - `Transaction.Paid` was then received and processed successfully.
  - PortOne v2 webhook was verified against a real production payment.

### Facility subscription

- `payment_intents`
  - `payment_id`: `sub_mni9bpwa_fwrjy0`
  - `payment_context`: `facility_subscription`
  - `facility_id`: `cdd64c96-6d81-474e-9434-149554e0703c`
  - `plan_id`: `PREMIUM`
  - `expected_amount`: `199000`
  - `status`: `paid`
  - `portone_status`: `PAID`

- `subscription_payments`
  - `portone_payment_id`: `sub_mni9bpwa_fwrjy0`
  - `payment_context`: `facility`
  - `amount`: `199000`
  - `status`: `completed`

- `facility_subscriptions`
  - `plan_id`: `PREMIUM`
  - `status`: `active`
  - `next_billing_date` updated

### Personal subscription

- `payment_intents`
  - `payment_id`: `psub_mni9wbdy_cj4hkd`
  - `payment_context`: `personal_subscription`
  - `user_id`: `64d01222-ee14-4b94-8fd2-4da381db6d3f`
  - `plan_id`: `PERSONAL_PREMIUM`
  - `expected_amount`: `4900`
  - `status`: `paid`
  - `portone_status`: `PAID`

- `subscription_payments`
  - `portone_payment_id`: `psub_mni9wbdy_cj4hkd`
  - `payment_context`: `personal`
  - `amount`: `4900`
  - `status`: `completed`

- `user_subscriptions`
  - `plan_id`: `PERSONAL_PREMIUM`
  - `plan_name`: `PERSONAL_PREMIUM`
  - `status`: `active`
  - `expires_at` updated

## Deployment Result

- `main` pushed to origin with `c1c132a`
- Vercel production deployment executed with `vercel --prod --yes`
- `memorimap.kr` alias confirmed on deployment `dpl_84KKEoMvnVVmCoDC56yYeSGkV32w`

## Notes

- `register-payment-intent` and `verify-payment` were temporarily adjusted to allow localhost origins for local validation
- `ai-test.html` returned connection failures during post-deploy curl checks, so that single live check was not conclusively closed in this session
- Local-only files were excluded from the code commit and deployment scope
