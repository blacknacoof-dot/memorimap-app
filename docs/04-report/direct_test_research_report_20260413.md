# Direct Test Research Report 2026-04-13

Date: 2026-04-13
Workspace: `C:\Users\black\Desktop\memorimap`
Purpose: leave a direct-test-only research record that can be reused as the starting point for the next precision verification pass

## Scope

This report records only the areas that were directly testable from the current environment without requiring:

- real OAuth account interaction
- real payment authorization
- real email inbox access
- physical device handling

This means the report focuses on:

- local automated E2E that can run from the current workspace
- production browser checks
- production redirect contract checks
- production storage/privacy checks
- mobile and in-app browser entry checks
- built-app chunk recovery simulation

## What Was Directly Testable

### Directly testable from this environment

- guest access and route blocking
- role boundary checks
- reservation persistence and protected data access
- facility admin protected actions
- Edge Function auth/authz boundaries
- OAuth request redirect targets
- password-reset request redirect target
- production app-shell render health
- production hashed asset bootstrap health
- storage anonymous/public vs signed URL behavior
- mobile browser entry behavior using UA simulation
- in-app browser guide behavior using UA simulation
- chunk recovery behavior using synthetic error injection

### Not directly completable from this environment

- real Google OAuth round-trip with final session establishment
- real Kakao OAuth round-trip with final session establishment
- real payment success/failure/cancel/retry
- real personal/facility live subscription billing
- real password-reset email click from mailbox
- physical iPhone/Android device touch, keyboard, safe-area, and in-app browser behavior

## Local Automated Verification Results

### 1. QA executable master

Command:

```powershell
npx playwright test tests/e2e/qa.execution.spec.ts --reporter=line --workers=1
```

Result:

- `4/4` passed

Confirmed:

- guest cannot enter `/#/super-admin`
- regular user does not see super-admin entry
- reservation end-to-end row persistence works
- My Page reservation tabs render

### 2. Facility admin reservation confirmation

Command:

```powershell
npx playwright test tests/e2e/facilityAdmin.confirmReservation.spec.ts --reporter=line --workers=1
```

Result:

- `2/2` passed

Confirmed:

- facility admin confirmation updates reservation state and event metadata
- foreign-facility reservation confirmation is blocked

### 3. Auth data isolation

Command:

```powershell
npx playwright test tests/e2e/auth.dataIsolation.spec.ts --reporter=line --workers=1
```

Result:

- `4/4` passed

Confirmed:

- anonymous client cannot read protected notifications
- user A cannot read user B notifications
- user A cannot read user B reservation rows directly
- logout invalidates old access token for protected Edge Function usage

### Notes on local E2E limitations encountered today

Some Playwright suites did not rerun cleanly during this pass because the configured dev-server port `5173` was reported as already in use by the test harness, even when `curl http://localhost:5173` did not succeed afterward.

Interpretation:

- this was an execution-environment or test-harness issue
- this did not produce evidence of an application regression
- rerunnable suites that do not depend on the blocked path continued to pass

This matters for the next pass:

- if a broader local E2E rerun is needed, start by checking the Playwright `webServer` reuse path and local port ownership before treating the failure as product-related

## Production Browser Verification

### 1. Guest smoke

Direct browser automation against `https://memorimap.kr` confirmed:

- root page renders successfully
- title resolves as `추모맵 - 추모 공간 지도`
- guest block for `https://memorimap.kr/#/super-admin` works
- no fatal `console` errors were observed
- no fatal `pageerror` was observed
- no hashed JS/CSS asset `404` was observed during bootstrap

Current interpretation:

- production shell is healthy for guest entry
- route protection for super-admin guest entry is active in production

### 2. OAuth redirect request contract

Production login modal requests were intercepted before real provider handoff.

Confirmed:

- Google authorize request contains `provider=google`
- Google authorize request contains `redirect_to=https://memorimap.kr`
- Kakao authorize request contains `provider=kakao`
- Kakao authorize request contains `redirect_to=https://memorimap.kr`

Current interpretation:

- provider redirect target generation is correct on production
- this closes request-generation correctness only
- it does not close real provider callback/session establishment

### 3. Password reset request contract

Previously confirmed in the same precision workstream and still relevant for next runs:

- password recover request uses `redirect_to=https://memorimap.kr/#/reset-password`

Current interpretation:

- production reset-link target generation is correct at request time

## Production Storage And Privacy Verification

Live checks were rerun against the production Supabase project.

Verified:

- `review-images` anonymous list returned `200` with `[]`
- `partner_docs` anonymous list returned `200` with `[]`
- direct public object URL for `review-images` returned `400`
- direct public object URL for `partner_docs` returned `400`
- signed URL fetch for sampled `review-images` object returned `200 image/jpeg`
- signed URL fetch for sampled `partner_docs` object returned `200 image/png`

Current interpretation:

- anonymous listing no longer exposes sampled private bucket contents
- direct public object access remains blocked
- authorized signed access continues to function

For the next test cycle, this means:

- the private bucket hardening check can be treated as currently closed unless storage policies change again

## Mobile And In-App Entry Verification

Production entry was tested with simulated user agents for:

- iPhone Safari
- Android Chrome
- Kakao in-app browser
- Naver in-app browser

Results:

- iPhone Safari: main app renders, no guide page
- Android Chrome: main app renders, no guide page
- Kakao in-app: external-browser guide renders, main app does not render
- Naver in-app: external-browser guide renders, main app does not render

Guide-copy verification:

- Kakao in-app shows Kakao-specific warning copy
- Naver in-app shows Naver-specific warning copy
- Naver no longer shows Kakao-specific warning copy

Current interpretation:

- normal mobile browsers can enter the main app
- in-app browsers are intentionally intercepted into the guide flow
- browser-specific copy is currently aligned for both Kakao and Naver

## Chunk Recovery Verification

Built app was served locally and tested with a synthetic persistent chunk error.

Method:

- open built app
- inject a repeated `Loading chunk failed` style error on load
- observe main-frame navigation count

Observed result:

- `navCount: 3`
- app did not enter the prior repeated reload loop pattern

Historical comparison:

- before the fix, a similar persistent simulation produced repeated navigations consistent with a reload loop
- after the fix, repeated loop behavior was not reproduced

Current interpretation:

- chunk recovery no longer re-arms the same reload path indefinitely for the same entry URL
- the previously confirmed reload-loop defect should be considered fixed unless contradicted by a future real stale-tab deployment scenario

## Direct-Test-Only Conclusion

As of 2026-04-13, the directly testable surface is in a strong state.

Directly verified as healthy:

- guest production entry
- super-admin guest block
- local role/data isolation suites that were runnable
- OAuth redirect request targets
- private storage anonymous block and signed URL access
- mobile browser entry
- Kakao/Naver in-app guide routing and copy
- chunk recovery loop prevention under synthetic persistent failure

Directly verified but still bounded:

- OAuth is correct at request-generation level
- not yet verified through full real provider round-trip

Not directly closed:

- real OAuth callback/session establishment
- real payment and subscription billing flows
- physical device checks

## Recommended Starting Point For Next Test Session

Use this order next time:

1. Real Google OAuth round-trip and final session confirmation
2. Real Kakao OAuth round-trip and final session confirmation
3. One real reservation payment success case
4. One reservation cancel or failure case
5. One real personal or facility subscription billing case
6. Physical iOS Safari and Android Chrome verification
7. Kakao and Naver in-app verification on real devices

## Quick Reuse Checklist

Before the next run:

- confirm current production alias with `vercel inspect https://memorimap.kr`
- use a cache-bypass URL such as `https://memorimap.kr/?release=<sha>`
- if Playwright local reruns fail on port `5173`, treat it as harness investigation first, not app failure by default
- if storage policies changed since this report, rerun the private bucket checks
- if chunk recovery code changed since this report, rerun the synthetic persistent chunk error simulation

## Final Working Judgment

Direct-test precision verification status:

- pass for directly testable application/runtime/security surfaces
- incomplete only for the remaining human-in-the-loop production flows
