# Memorimap Playwright Security Execution Plan

Date: 2026-03-30
Scope: release-blocking Playwright security scenarios
Runner mode: serial, `--workers=1`, line reporter

## 1. Objective

This plan defines the concrete Playwright execution order, expected outcome, and stop conditions for the release-blocking security suite.

## 2. Target Scenarios

### Suite A. Edge Function Auth Boundaries

File:
- `tests/e2e/auth.edgeFunctions.spec.ts`

Purpose:
- block missing auth
- block tampered tokens
- block regular user access to admin-only functions
- block facility admin access to foreign facility resources

Command:

```powershell
npx playwright test tests/e2e/auth.edgeFunctions.spec.ts --reporter=line --workers=1
```

Expected outcomes:
- no Authorization header => `401`
- tampered token => `401`
- regular user calling admin-only function => `403`
- foreign facility update attempt => `403`

Fail immediately if:
- any protected function returns `200`
- any forbidden path returns `401` when auth is valid but role is insufficient

### Suite B. Cross-User Data Isolation

File:
- `tests/e2e/auth.dataIsolation.spec.ts`

Purpose:
- verify notification isolation
- verify reservation isolation
- verify old token is unusable after logout on protected path

Command:

```powershell
npx playwright test tests/e2e/auth.dataIsolation.spec.ts --reporter=line --workers=1
```

Expected outcomes:
- anonymous client cannot read protected notification rows
- user A cannot read user B notification
- user A cannot read user B reservation
- stale token after sign-out fails on protected function

Fail immediately if:
- any cross-user row is returned
- stale token still succeeds on protected edge endpoint

### Suite C. Role / RPC Integrity

File:
- `tests/e2e/auth.roleAccess.spec.ts`

Purpose:
- verify `get_user_role`
- verify `is_super_admin`
- verify `super_admin` precedence remains correct

Command:

```powershell
npx playwright test tests/e2e/auth.roleAccess.spec.ts --reporter=line --workers=1
```

Expected outcomes:
- facility owner resolves to `facility_admin`
- super admin resolves to `super_admin`
- `is_super_admin(p_user_id)` returns `true` only for super admin

Fail immediately if:
- RPC returns wrong role
- super admin precedence breaks

### Suite D. XSS Regression

File:
- `tests/e2e/security.xss.spec.ts`

Purpose:
- ensure hostile review or text payload stays inert in rendered UI and stored output flow

Command:

```powershell
npx playwright test tests/e2e/security.xss.spec.ts --reporter=line --workers=1
```

Expected outcomes:
- no script execution
- no event-handler execution
- no `javascript:` navigation survives

Fail immediately if:
- alert/script execution occurs
- sanitized output still contains executable payload markers

### Suite E. Report Endpoint / Cron Boundary

File:
- `tests/e2e/report.smoke.spec.ts`

Purpose:
- verify cron/report endpoint remains protected from non-cron callers

Command:

```powershell
npx playwright test tests/e2e/report.smoke.spec.ts --reporter=line --workers=1
```

Expected outcomes:
- non-cron or unauthorized access rejected
- valid protected path behavior preserved

Fail immediately if:
- report endpoint becomes reachable by normal user context

## 3. Execution Order

Run in this order:

1. `auth.edgeFunctions.spec.ts`
2. `auth.dataIsolation.spec.ts`
3. `auth.roleAccess.spec.ts`
4. `security.xss.spec.ts`
5. `report.smoke.spec.ts`

Reason:
- auth boundary failures invalidate later scenario meaning
- data isolation and role integrity are higher risk than UI XSS regressions

## 4. Single Command Full Run

```powershell
npx playwright test tests/e2e/auth.edgeFunctions.spec.ts tests/e2e/auth.dataIsolation.spec.ts tests/e2e/auth.roleAccess.spec.ts tests/e2e/security.xss.spec.ts tests/e2e/report.smoke.spec.ts --reporter=line --workers=1
```

## 5. Environment Requirements

- `.env.local` or shell env contains:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- target Supabase migrations already applied
- target Edge Functions redeployed
- web app build/deploy corresponds to release candidate commit

## 6. Evidence to Capture

For each suite record:
- executed command
- start/end time
- pass/fail
- first failing test name if any
- screenshot or trace path if generated

Recommended evidence format:

```md
- Suite: auth.edgeFunctions
- Command: npx playwright test tests/e2e/auth.edgeFunctions.spec.ts --reporter=line --workers=1
- Result: PASS
- Notes: all protected edge boundaries returned expected 401/403
```

## 7. Release Decision Rule

Release GO:
- all five suites pass without auth/authz regression

Release HOLD:
- any suite in A, B, or C fails
- any XSS execution occurs
- any protected report endpoint becomes accessible
