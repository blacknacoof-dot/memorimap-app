# Post-Deploy Test Runbook

Updated: 2026-04-10
Target app: `https://memorimap.kr`

## Purpose

This runbook is for the first 30-60 minutes after a production deploy.
It is optimized for this repository's actual risk areas:

- Vercel static deploy + hashed assets
- Supabase Auth + RLS + Storage
- Supabase Edge Functions
- PortOne payments and refunds
- Multi-role admin access

## Release Gate

Do not treat deployment as complete until all of these pass:

- production URL loads without fatal console or network errors
- OAuth and password reset redirect correctly on production domain
- reservation payment verification works end-to-end
- facility/personal subscription payment verification works end-to-end
- role boundaries hold for user, facility admin, sangjo admin, super admin
- private storage remains private

## Phase 1: 5-Minute Smoke

Open production in a clean browser profile and verify:

1. `https://memorimap.kr` returns the new deployment and loads the main map.
2. Search works and facility list/detail open normally.
3. Side menu opens and closes.
4. Login modal opens.
5. `/#/super-admin` is blocked for guests.
6. Browser console has no fatal runtime errors.
7. Network tab has no unexpected `4xx` or `5xx` for app bootstrap requests.

Required evidence:

- root page status `200`
- no missing `/assets/*.js` or `/assets/*.css`
- no CSP violations for Supabase, PortOne, Naver Map, Google/Kakao auth

## Phase 2: Cache and Chunk Safety

This app has explicit chunk recovery logic in:

- `index.tsx`
- `lib/chunkRecovery.ts`
- `vercel.json`

Verify:

1. Keep an old production tab open.
2. Deploy a new build.
3. Return focus to the old tab.
4. Confirm the app either keeps working or reloads once and recovers.
5. Confirm there is no infinite reload loop.

Why this matters:

- `index.html` is served with `no-store`
- `/assets/*` is served with long-lived immutable cache
- stale HTML and fresh assets are safe
- stale tab and fresh HTML must also recover safely

## Phase 3: Auth and Redirect Validation

Check production-domain auth, not localhost assumptions.

### Email/password

1. Sign in with a normal user.
2. Sign out.
3. Trigger password reset.
4. Open the email link.
5. Confirm it lands on `https://memorimap.kr/#/reset-password`.

### OAuth

1. Test Google login.
2. Test Kakao login.
3. Confirm redirect returns to `https://memorimap.kr`.
4. Confirm session is actually established after redirect.

Failure pattern to watch:

- provider login succeeds but redirect lands on wrong host
- reset email opens preview/old domain
- production alias works but Supabase Redirect URLs or Site URL still point elsewhere

## Phase 4: Reservation Payment Flow

Use a real production-safe test account and a real payment scenario if the PG is live.

Verify:

1. User opens a facility.
2. User creates a reservation.
3. Payment UI opens successfully.
4. Success case calls `verify-payment`.
5. Reservation row is persisted with correct payment state.
6. My Page shows the reservation.
7. Facility admin can confirm or manage it.

Also test:

- payment cancel
- payment failure
- duplicate submit attempt
- retry after interrupted flow

Expected invariants:

- one logical reservation per successful completion
- no paid UI state without DB persistence
- no DB paid state for failed or cancelled payment

## Phase 5: Subscription Payment Flow

This app has separate subscription verification paths for facility and personal plans.

Verify both:

1. facility subscription upgrade
2. facility downgrade/free transition
3. personal subscription upgrade
4. personal downgrade/free transition

For each flow, confirm:

- `register-payment-intent` succeeds
- payment succeeds or fails correctly
- `verify-payment` persists expected state
- subscription status in UI matches database state
- payment history is visible where expected

High-risk area:

- client success without server persistence
- wrong plan applied
- duplicate ledger rows
- stale prior plan remaining active

## Phase 6: Edge Function Boundary Check

Production checks must confirm not only happy path but auth boundary.

Critical functions in this repo:

- `approve-partner`
- `verify-payment`
- `register-payment-intent`
- `process-refund`
- `deploy-bot-data`
- `gemini-proxy`

Verify:

1. unauthenticated requests are rejected
2. tampered or expired JWT is rejected
3. regular user cannot call admin-only functions
4. facility admin cannot act on another facility's data
5. super admin only flows remain super-admin only

## Phase 7: Role and RLS Verification

Test with four accounts:

- guest
- regular user
- facility admin
- super admin

Minimum checks:

1. Guest cannot access protected admin routes.
2. Regular user does not see super admin entry points.
3. Facility admin sees only owned facility data.
4. Super admin can access platform-wide monitoring and admin tools.
5. Cross-account data access is blocked.

Focus areas:

- reservations
- consultations
- facility edits
- partner approvals
- audit or monitoring views
- payment and subscription records

## Phase 8: Storage and Privacy

Recent releases touched private bucket hardening, so verify storage directly after deploy.

Check:

1. `facility-images` remains public if intended.
2. `review-images` remains private.
3. `partner_docs` remains private.
4. signed URLs work for authorized viewers.
5. anonymous listing or direct object access is blocked for private buckets.

Record:

- bucket public flags
- active storage policies
- at least one authorized access example
- at least one rejected anonymous access example

## Phase 9: Admin Flows

### Facility admin

Verify:

1. dashboard loads
2. reservation management works
3. consultation list works
4. facility info edit works
5. subscription or revenue UI loads without permission errors

### Super admin

Verify:

1. monitoring tab loads
2. communication tab navigation works
3. partner approval works
4. notices and user management load
5. audit or monitoring data loads without RLS errors

## Phase 10: Mobile and Real Browser Check

Desktop Chrome is not enough for this app.

Verify on:

- iOS Safari
- Android Chrome

Check:

1. safe area and bottom nav spacing
2. map interactions
3. sheet/modal scrolling
4. login modal
5. payment popup behavior
6. AI chat input visibility
7. in-app browser redirect edge cases

## Local Pre-Deploy / Post-Deploy Commands

Run these locally before or immediately after deploy:

```powershell
npm run verify
npx playwright test tests/e2e/qa.execution.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/auth.roleAccess.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/auth.edgeFunctions.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/reservation.payment.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/superAdmin.monitoring.spec.ts --reporter=line --workers=1
```

Useful additional suites:

- `tests/e2e/subscription.flow.spec.ts`
- `tests/e2e/facilityAdmin.confirmReservation.spec.ts`
- `tests/e2e/report.smoke.spec.ts`
- `tests/e2e/ai.compare.spec.ts`

## Stop Conditions

Stop release rollout and investigate immediately if any of these occur:

- production root loads but hashed assets `404`
- OAuth redirect goes to wrong domain
- payment success does not persist
- duplicate payment or subscription rows appear
- admin route is visible to wrong role
- private storage object becomes anonymously accessible
- new deploy causes unrecoverable chunk error on existing tab

## Evidence Template

For each deploy, record:

- production domain
- Vercel deployment id
- git commit SHA
- test accounts used
- smoke result
- auth result
- payment result
- subscription result
- role/RLS result
- storage/privacy result
- mobile result
- open risks

## Repo References

- `docs/LAUNCH_VERIFICATION_FRAMEWORK.md`
- `docs/MANUAL_TEST_CHECKLIST.md`
- `docs/04-report/deployment_precision_verification_20260408.md`
- `tests/e2e/qa.execution.spec.ts`
- `tests/e2e/auth.roleAccess.spec.ts`
- `tests/e2e/auth.edgeFunctions.spec.ts`
- `tests/e2e/reservation.payment.spec.ts`
- `tests/e2e/superAdmin.monitoring.spec.ts`
