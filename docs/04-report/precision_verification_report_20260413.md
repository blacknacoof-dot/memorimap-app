# Precision Verification Report 2026-04-13

Date: 2026-04-13
Workspace: `C:\Users\black\Desktop\memorimap`
Branch: `main`
Commit under test: `15fcfb11bac91c9755c5331b98b13c3a086e1252`
Constraint: no application code changes performed

## Scope

This report consolidates the precision verification work executed on 2026-04-13.

Validated areas:

- local high-risk automated E2E suites
- production guest smoke checks
- production alias and basic runtime behavior
- OAuth and password-reset redirect contracts
- private storage bucket anonymous access and signed URL behavior
- mobile browser and in-app browser entry behavior
- stale-tab and chunk-recovery behavior

Out of scope for direct completion today:

- real OAuth round-trip session establishment
- live PortOne payment success/failure/cancel/retry
- live facility/personal subscription billing
- physical device touch/layout verification on iOS/Android

## Environment And Method

- Local browser automation: Playwright
- Local database and fixture-backed validation: Supabase service role test utilities already present in the repo
- Production browser checks: direct browser automation against `https://memorimap.kr`
- Production storage checks: live Supabase Storage API requests
- No source files were edited during this work

## Executed Verification

### 1. Local High-Risk Automated Suites

Executed:

```powershell
npx playwright test tests/e2e/qa.execution.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/auth.roleAccess.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/auth.edgeFunctions.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/reservation.payment.spec.ts --reporter=line --workers=1
npx playwright test tests/e2e/subscription.flow.spec.ts --reporter=line --workers=1
```

Result:

- `qa.execution.spec.ts`: `4/4` passed
- `auth.roleAccess.spec.ts`: `6/6` passed
- `auth.edgeFunctions.spec.ts`: `6/6` passed
- `reservation.payment.spec.ts`: `6/6` passed
- `subscription.flow.spec.ts`: `2/2` passed

Coverage confirmed:

- guest blocked from `/#/super-admin`
- regular user does not see super-admin entry
- role resolution and `is_super_admin` behavior
- unauthenticated and tampered-token Edge Function rejection
- facility admin foreign-resource protection
- reservation creation, verification, cancel, IDOR defense, tamper defense
- facility subscription canonical state transition and no-op reselect behavior

Interpretation:

- The local release-critical E2E set remains stable.
- No regression signal appeared in the repository-backed high-risk paths covered by these suites.

### 2. Production Guest Smoke

Direct browser checks against `https://memorimap.kr` confirmed:

- root page loads successfully
- page title resolves as `추모맵 - 추모 공간 지도`
- guest route `https://memorimap.kr/#/super-admin` renders a login-required block screen
- no fatal `pageerror` was observed
- no hashed JS/CSS asset `404` was observed during bootstrap

Observed non-blocking request noise:

- Google Analytics collection requests were aborted in automation context
- some Unsplash image requests were blocked by ORB in headless context

Interpretation:

- These did not prevent application bootstrap and did not indicate production app-shell failure.

### 3. OAuth And Password Reset Redirect Contracts

Production login modal requests were intercepted without completing real authentication.

Confirmed:

- Google OAuth `redirect_to`: `https://memorimap.kr`
- Kakao OAuth `redirect_to`: `https://memorimap.kr`
- password reset recover request `redirect_to`: `https://memorimap.kr/#/reset-password`

Interpretation:

- Production redirect contract is correctly wired at request generation time.
- This closes redirect-target correctness.
- It does not fully close real provider round-trip or final session establishment.

### 4. Private Storage Verification

Live production-side storage checks were performed against the Supabase project.

Verified:

- `review-images` anonymous list call returned `200` with empty array `[]`
- `partner_docs` anonymous list call returned `200` with empty array `[]`
- direct public object URL for `review-images` returned `400`
- direct public object URL for `partner_docs` returned `400`
- signed URL creation for sampled `review-images` object returned `200`
- signed URL creation for sampled `partner_docs` object returned `200`
- immediate signed URL fetch for sampled `review-images` object returned `200` with `image/jpeg`
- immediate signed URL fetch for sampled `partner_docs` object returned `200` with `image/png`

Interpretation:

- Private bucket anonymous exposure is blocked at the object-access level.
- Signed URL access works for authorized creation paths.
- This closes the previously open `private bucket 익명 차단 + signed URL` verification item for sampled live objects.

### 5. Mobile And In-App Entry Checks

Production entry behavior was tested with these user agents:

- iPhone Safari
- Android Chrome
- KakaoTalk in-app browser
- Naver in-app browser

Confirmed:

- iPhone Safari opens the main application normally
- Android Chrome opens the main application normally
- KakaoTalk in-app opens the external-browser guide instead of the main app
- Naver in-app also opens the external-browser guide instead of the main app
- no fatal console or page errors were observed in these entry checks

Additional contract verification:

```powershell
npx vitest run src/utils/browserDetection.test.ts
```

Result:

- `src/utils/browserDetection.test.ts`: passed

## Confirmed Findings

### Finding 1. Persistent chunk failure can still enter a reload loop

Relevant file:

- [lib/chunkRecovery.ts](/C:/Users/black/Desktop/memorimap/lib/chunkRecovery.ts)

Observed behavior:

- a single synthetic chunk error triggered one automatic reload and the app recovered to `/`
- when the same chunk error condition was forced repeatedly on each load, the page navigated repeatedly instead of stopping after one attempt
- in the loop simulation, main-frame navigation was observed `12` times in roughly 8 seconds

Likely cause:

- `sessionStorage` reload guard key is removed at bootstrap in `lib/chunkRecovery.ts:96`
- reload guard is set in `lib/chunkRecovery.ts:33-38`
- because the key is cleared on each new load, a persistent error can re-arm the reload path indefinitely

Impact:

- one-time recovery is present
- infinite reload prevention is not fully achieved under persistent chunk-failure conditions

Status:

- release-relevant issue remains open

### Finding 2. Naver in-app browser shows Kakao-specific guide copy

Relevant files:

- [components/AppRouteLayout.tsx](/C:/Users/black/Desktop/memorimap/components/AppRouteLayout.tsx)
- [src/pages/ExternalBrowserGuidePage.tsx](/C:/Users/black/Desktop/memorimap/src/pages/ExternalBrowserGuidePage.tsx)

Observed behavior:

- Naver in-app user agent is blocked into the external browser guide
- guide text still renders Kakao-specific copy such as `카카오톡 앱에서는 로그인이 제한됩니다`

Likely cause:

- `AppRouteLayout` renders `ExternalBrowserGuidePage` directly for in-app browsers
- `ExternalBrowserGuidePage` reads `window.location.search`
- when no `browser` query is present, it defaults to `kakaotalk`

Impact:

- in-app blocking behavior itself works
- Naver users receive incorrect product guidance

Status:

- UX correctness issue remains open

## Overall Status

Closed today:

- local automated precision verification
- production guest smoke
- `/#/super-admin` guest block
- OAuth redirect target contract
- password-reset redirect target contract
- private storage anonymous block
- private storage signed URL sampled access
- mobile Safari and Android Chrome entry smoke
- Kakao and Naver in-app block behavior

Not fully closed:

- real Google/Kakao OAuth round-trip and final session establishment
- live reservation payment success/failure/cancel/retry
- live facility subscription payment
- live personal subscription payment
- stale-tab/chunk-recovery no-loop guarantee
- physical device touch/layout checks on iOS Safari and Android Chrome
- Kakao/Naver in-app guide-copy correctness for all browser variants

## Precision Verification Judgment

Current judgment:

- local automated precision verification: pass
- static deploy and security contract verification: pass
- production guest/runtime baseline: pass
- production auth redirect contract: pass
- production private storage behavior: pass
- mobile/in-app entry baseline: pass with one UX correctness defect
- stale-tab/chunk recovery: partial pass with one release-relevant defect
- production real-user transactional flows: incomplete

## Recommended Next Sequence

1. Fix and re-verify the chunk-recovery reload-loop behavior before treating stale-tab recovery as closed.
2. Fix and re-verify Naver in-app guide copy so browser-specific instructions are accurate.
3. Execute real OAuth round-trip with test accounts.
4. Execute one live reservation payment success case and at least one cancel or failure case.
5. Execute one live facility or personal subscription billing case.
6. Complete physical device checks on iOS Safari, Android Chrome, Kakao in-app, and Naver in-app.

## Final Conclusion

Precision verification progressed materially on 2026-04-13.

The deployment and runtime baseline are strong:

- production guest entry is healthy
- major local high-risk suites are green
- redirect contracts are correct
- private storage protections behave correctly in live checks
- in-app blocking behavior is active

However, this work did not produce a full release-close verdict.

Two concrete issues remain after direct testing:

- stale-tab chunk recovery can loop under persistent failure conditions
- Naver in-app browser receives Kakao-specific guide text

Real transactional production flows also remain outstanding until live auth and live billing cases are executed end-to-end.
