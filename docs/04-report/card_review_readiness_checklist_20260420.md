# Card Review Readiness Checklist

Date: 2026-04-20
Scope: KCP card review submission readiness for recurring and reservation payments

## 2026-04-21 Operational Evidence Status

Production verification date: 2026-04-21 (Asia/Seoul)
Project ref: `xvmpvzldezpoxxsarizm`
Current submission status: blocked

### Scope Result

1. `payment_audits` migration pre-apply check
   - Status: not applied in production
   - Evidence: server-side Supabase query for `public.payment_audits` returned `PGRST205` (`Could not find the table 'public.payment_audits' in the schema cache`).
   - Impact: no live audit rows can be written yet, so KCP review field storage cannot be proven.

2. Reviewer login account readiness
   - Personal reviewer candidate: `kcp-review@memorimap.kr`
   - Current state: login exists and last sign-in was `2026-04-20T01:58:51Z`, but `user_subscriptions.plan_id = personal_free`.
   - Judgment: account exists, but paid personal flow review evidence is not ready.
   - Facility reviewer candidate: `freedlife.test@atomcare.kr`
   - Current state: login exists, last sign-in was `2026-04-17T06:10:54Z`, and `sangjo_hq_admins` links the account to sangjo facility `7fd43013-842d-4cbb-94ca-8ca0dc3ac785` (`funeral_companies.name = FreedLife`).
   - Linked live facility subscription: `facility_subscriptions.plan_id = SJ_STARTER`, `status = active`, `auto_renew = true`.
   - Judgment: facility reviewer linkage is ready.

3. Production KCP window and price parity captures
   - Existing local screenshot files: `docs/04-report/screenshots/product-list-prices.png`, `business-info-footer.png`, `product-detail-basic.png`, `refund-policy.png`
   - Missing evidence: production KCP payment window capture, plan-screen to payment-window same-amount pair, live checkout capture proving real PG branding
   - Judgment: submission evidence not ready

4. One real payment sample with `payment_audits.raw_payload`
   - Recent real payment samples do exist in `subscription_payments`:
   - Personal: `psub_mni9wbdy_cj4hkd`, `4900 KRW`, paid at `2026-04-03T02:17:51.279`
   - Facility: `sub_mnpds2xg_dw6ov7`, `49000 KRW`, paid at `2026-04-08T01:40:47.21`
   - Blocker: `payment_audits` table is absent in production, so no `raw_payload` sample exists yet.
   - `res_cd` validation status: not verified on a live sample
   - Additional note: direct PortOne API lookup from this workspace returned `401 UNAUTHORIZED`, which indicates the local environment does not currently have a usable `PORTONE_API_SECRET` for operator-side live lookup.

5. Checklist reflection
   - Reflected in this document on `2026-04-21`
   - Final judgment for this turn: do not submit yet

### Immediate Blocking Items Before Submission

- Apply `20260420193000_add_payment_audits_for_kcp_review.sql` to production first.
- Run one real payment after the migration and confirm `payment_audits` row creation.
- Verify `raw_payload.payment.pgResponse.res_cd` from that live row before relying on the `PAID -> 0000` fallback.
- Prepare one paid personal reviewer account, or explicitly designate an existing paid personal account for review.
- Capture the production KCP payment window and the amount-parity screenshot pair.

## Code-Level Review Field Handling

Required KCP review fields are normalized, stored, and logged in these paths:

- `verify-payment`
  - File: `supabase/functions/verify-payment/index.ts`
  - Covers: reservation verification, subscription verification
  - Input support: client SDK result plus PortOne payment lookup
- `issue-billing-key`
  - File: `supabase/functions/issue-billing-key/index.ts`
  - Covers: first recurring charge after billing key issuance
- `charge-subscription`
  - File: `supabase/functions/charge-subscription/index.ts`
  - Covers: recurring batch rebill
- `payment-webhook`
  - File: `supabase/functions/payment-webhook/index.ts`
  - Covers: webhook-side final synchronization

Normalized audit storage:

- table: `payment_audits`
- migration: `20260420193000_add_payment_audits_for_kcp_review.sql`
- shared normalizer: `supabase/functions/_shared/paymentAudit.ts`

## Field Mapping

Common required fields:

- `res_cd`
  - Source priority: `pgResponse.res_cd`, `failure.pgCode`, `pgCode`, client `pgCode`, client `code`
  - Success fallback: `0000` when PortOne payment status is `PAID`
- `tno`
  - Source priority: `pgTxId`, `transactionId`, latest transaction ids, client `transactionId`, client `txId`
- `amount`
  - Source priority: `payment.amount.total`, fallback request amount
- `pay_method`
  - Source priority: `payment.method.type`, fallback requested pay method

Card-only required fields:

- `app_no`
  - Source priority: card approval number
- `card_cd`
  - Source priority: card issuer or publisher code/name from PortOne payment method
- `card_no`
  - Source priority: masked card number from PortOne payment method
- `card_mny`
  - Source priority: paid amount for card method

Review completeness rule:

- audit row is `complete` only when all common required fields exist
- card payment is `complete` only when all card-specific fields also exist
- incomplete rows are kept and logged to `system_logs` for operator review

## UI / Reviewer Access

Current review-facing behavior:

- guest users can compare plans but cannot start payment
- recurring checkout starts only after login
- mobile and desktop both expose business information by default
- detailed legal and refund policy remain accessible in `LegalModal`

Mandatory operational preparation before submission:

- provide reviewer login accounts for:
  - personal subscription flow
  - facility subscription flow
- verify reviewer accounts have the correct role and target facility linkage
- prepare one review guide with:
  - login URL
  - test reviewer id
  - password delivery channel
  - target screens to inspect

## Submission Blocking Checks

- public site reachable from outside reviewer network
- homepage, product detail, and payment entry render without broken text
- mobile screen shows business information without extra taps
- prices on plan screen exactly match payment window amount
- real production payment window is shown, not test PG branding
- `payment_audits` records are created for at least one real payment attempt

## Operational Evidence To Capture

- reviewer login account list and role mapping
- screenshot of plan price screen
- screenshot of production KCP payment window
- screenshot pair proving screen amount equals payment window amount
- one `payment_audits` sample row showing populated review fields
- one `system_logs` sample row if any required field is incomplete

## SQL Checks

Recent incomplete review rows:

```sql
select
  payment_id,
  payment_context,
  source,
  review_status,
  res_cd,
  tno,
  amount,
  pay_method,
  app_no,
  card_cd,
  card_no,
  card_mny,
  missing_fields,
  created_at
from payment_audits
where review_status = 'incomplete'
order by created_at desc
limit 50;
```

Recent complete review rows:

```sql
select
  payment_id,
  payment_context,
  source,
  review_status,
  res_cd,
  tno,
  amount,
  pay_method,
  app_no,
  card_cd,
  card_no,
  card_mny,
  created_at
from payment_audits
where review_status = 'complete'
order by created_at desc
limit 50;
```
