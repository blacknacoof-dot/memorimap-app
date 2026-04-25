# E2E Priority Run Report

Date: 2026-04-10
Workspace: `C:\Users\black\Desktop\memorimap`
Constraint: no application code changes performed

## Scope

Priority post-deploy E2E set executed:

- `tests/e2e/qa.execution.spec.ts`
- `tests/e2e/auth.roleAccess.spec.ts`
- `tests/e2e/auth.edgeFunctions.spec.ts`
- `tests/e2e/reservation.payment.spec.ts`
- `tests/e2e/subscription.flow.spec.ts`
- `tests/e2e/facilityAdmin.confirmReservation.spec.ts`
- `tests/e2e/superAdmin.monitoring.spec.ts`

## Environment Notes

- `npm run verify` passed before the E2E run.
- No source code files were modified.
- One transient Playwright infrastructure issue occurred when two suites were launched in parallel:
  - `superAdmin.monitoring.spec.ts`
  - failure cause: Vite dev server could not start because port `5173` was already in use
  - action taken: rerun the suite alone
  - final suite result: passed

Interpretation:

- This was a test-run orchestration issue, not an application behavior failure.

## Results Summary

Total suites executed: 7
Total tests passed: 27
Total tests failed: 0

### Suite Results

1. `qa.execution.spec.ts`
   - result: passed
   - tests: 4/4
   - coverage:
     - guest blocked from super-admin route
     - regular user does not see super-admin entry
     - reservation end-to-end persistence
     - my page reservation visibility

2. `auth.roleAccess.spec.ts`
   - result: passed
   - tests: 6/6
   - coverage:
     - `profiles` and `super_admins` consistency
     - `get_user_role` role resolution
     - `is_super_admin` behavior

3. `auth.edgeFunctions.spec.ts`
   - result: passed
   - tests: 6/6
   - coverage:
     - missing auth rejected
     - tampered token rejected
     - regular user blocked from admin function
     - facility admin blocked from foreign facility action
     - `approve-partner` guarded
     - `verify-payment` rejects unauthenticated calls

4. `reservation.payment.spec.ts`
   - result: passed
   - tests: 6/6
   - coverage:
     - reservation creation
     - pre-payment state correctness
     - payment verification state update
     - IDOR defense
     - amount tampering detection
     - cancel state transition

5. `subscription.flow.spec.ts`
   - result: passed
   - tests: 2/2
   - coverage:
     - free -> premium -> free canonicalization
     - re-selecting current plan is a no-op

6. `facilityAdmin.confirmReservation.spec.ts`
   - result: passed
   - tests: 2/2
   - coverage:
     - facility admin reservation confirmation
     - RLS defense for foreign reservation

7. `superAdmin.monitoring.spec.ts`
   - result: passed
   - tests: 1/1
   - coverage:
     - monitoring card visibility
     - communication navigation
     - admin memo persistence

## Key Findings

No functional failures were observed in the priority E2E set.

The highest-risk areas covered by this run currently appear stable:

- auth and role boundary enforcement
- edge function auth/authz checks
- reservation payment persistence path
- subscription state transition path
- facility admin reservation confirmation path
- super admin monitoring path

## Residual Risks

These were not disproven by this run and still require production-focused validation:

- real production-domain OAuth redirect behavior
- real PortOne live success/failure/cancel behavior
- production CORS and secret wiring for Edge Functions
- mobile Safari and Android Chrome behavior
- stale-tab chunk recovery after a fresh deploy
- private storage bucket access behavior in production

## Commands Executed

```powershell
npm run verify
npx playwright test tests/e2e/qa.execution.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/auth.roleAccess.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/auth.edgeFunctions.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/reservation.payment.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/subscription.flow.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/facilityAdmin.confirmReservation.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/superAdmin.monitoring.spec.ts --reporter=line --workers=1
```

## Conclusion

Priority E2E status: pass

Based on the local priority suite, there is no immediate regression signal in the repository's core post-deploy paths.
Production release confidence improves materially for:

- auth boundary safety
- RLS boundary safety
- payment-related state persistence
- admin critical-path behavior

The next recommended step is production-only validation using:

- `docs/POST_DEPLOY_TEST_RUNBOOK.md`
- real production domain
- real browser/device checks
- live payment smoke cases
