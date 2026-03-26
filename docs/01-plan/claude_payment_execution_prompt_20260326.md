# Claude Payment Execution Prompt

작성일: 2026-03-26
목적: Claude가 Memorimap의 NHN KCP 실연동, 일반결제/정기결제 분리, 빌링키 준비 작업을 바로 수행할 수 있도록 작업 지시를 고정한다.

## 1. 기준 문서

- `docs/01-plan/portone_nhn_kcp_direction_20260325.md`
- `docs/01-plan/billing_key_recurring_payment_plan.md`
- `docs/01-plan/features/subscription_pricing_migration.plan.md`

## 2. 현재 상태

- NHN KCP 기준으로 PortOne 실연동 진행
- 일반결제와 정기결제는 분리
- 일반결제는 `general` 채널
- 정기결제는 `billing` 채널
- 상조 유료 과금 주체는 본사만
- 상조 플랜:
  - 파일럿 150만원/월
  - Growth 300만원/월
  - Enterprise 500만원/월
- 지사/대리점은 본사 하위 운영 계정으로만 처리
- 월 정기결제 해지는 `다음 결제일부터 중단`, 당월 환불 없음
- 파일럿 3개월 중도 해지는 원칙적으로 환불 없음
- 연간 `12개월 결제 + 1개월 추가` 정책은 문서상 확정 초안이지만 현재 코드에는 미구현

## 3. 이미 확인된 테스트 결과

- `tests/e2e/subscription.flow.spec.ts` 통과
- `tests/e2e/reservation.payment.spec.ts` 통과

정리:

- 현재 일반 결제 검증 흐름은 살아 있음
- 현재 시설 구독 결제 반영 흐름은 살아 있음
- 아직 미구현 영역은 KCP 빌링키 발급, 서버사이드 자동 정기결제, 해지 예약

## 4. 이번 작업 목표

1. `prepare/v2 400` 원인 진단 및 일반결제 실결제 정상화
2. 일반결제 화면과 정기결제 화면/문구/정책 블록 분리
3. KCP 빌링키 발급 흐름 구현 준비
4. 실제 코드 작업을 단계적으로 진행하고, 각 단계에서 테스트 가능 상태까지 만들 것

## 5. 중요 구현 원칙

- KCP 우선, 다만 PG 종속 하드코딩은 최소화
- `general`과 `billing`은 코드 구조상 계속 분리
- KCP 문서 해석은 보수적으로 적용
- `customer`는 빈 문자열 금지, 값 없으면 필드 생략
- `site_name`은 bypass에 포함

### 5.1 일반결제 화면 문구

- `1회 결제`
- `이번 한 번만 청구`
- `정기 청구 없음`

### 5.2 정기결제 화면 문구

- `매월 자동 결제`
- `최초 카드 등록 후 동일일 청구`
- `해지 시 다음 결제일부터 중단`
- `당월 환불 없음`

## 6. 작업 순서

### Phase A

- 현재 `prepare/v2 400` 디버깅
- `paymentId`, `customer.phoneNumber`, `channelKey-storeId`, bypass 파라미터 점검
- 일반결제 실연동 성공 상태 만들기

### Phase B

- 일반결제 UI와 정기결제 UI 분리
- 결제 전 안내 블록/정책 문구/CTA 분리
- 시설 엔터프라이즈는 문의형으로 유지, 즉시 결제 버튼 제거
- 개인은 `무료 / 프리미엄 4,900 / 시그니처 9,900` 구조 반영 검토

### Phase C

- `lib/portone.ts`에 `requestIssueBillingKey()` 추가
- `Window.PortOne` 타입 확장
- 빌링키 발급용 request params 타입 정의
- 아직 서버 자동청구까지는 안 가더라도, 클라이언트 카드등록 흐름까지 연결 준비

### Phase D

- 빌링키 저장/자동결제/해지 예약을 위한 Edge Function 및 DB 마이그레이션 초안 작성
- `cancel_at_period_end`, `cancelled_at`, `cancelled_reason` 등 문서 기준 반영
- 구현 전 필요한 리스크/질문 정리

## 7. 상조 관련 원칙

- 상조는 본사만 과금
- 파일럿은 최소 3개월
- 파일럿 종료 후 기본 전환안은 `Growth 300만원`
- `Enterprise 500만원`은 맞춤 계약형
- 자동 전환은 하지 말고 사전 안내 후 수동 협의

## 8. 산출물 요구

- 실제 코드 수정
- 필요한 마이그레이션 초안
- 테스트 또는 수동 검증 결과
- 남은 블로커 명확히 정리

## 9. 우선순위

- 말로 설명하지 말고 먼저 코드베이스 읽고 바로 작업
- 첫 번째 목표는 일반결제 KCP 실테스트 성공 가능 상태 복구
- 그 다음 UI 분리
- 그 다음 빌링키 준비

## 10. 응답 방식

- findings보다 구현 우선
- 막히는 지점만 짧게 보고
- 끝나면 변경 파일, 테스트 결과, 남은 블로커를 정리

## 11. Phase A 완료 기록 (2026-03-26)

### 수정 내용

- `lib/portone.ts`: bypass.kcp_v2.site_name 기본 포함, requestIssueBillingKey 추가, generatePaymentId/generateIssueId 유틸 추가, Window.PortOne 타입 확장
- `components/PersonalSubscriptionPlans.tsx`: useUser 사용으로 customer 필드 수정, phone/email fallback 추가, 정기결제 정책 문구 반영
- `components/SubscriptionPlans.tsx`: generatePaymentId 적용, phone/email fallback 추가, FAQ 정기결제 정책 문구 반영

### prepare/v2 400 원인 및 수정

- PersonalSubscriptionPlans가 raw session.user를 사용 → email/phone 누락 → KCP 필수 필드 미전송
- bypass.kcp_v2.site_name 누락 (모바일 필수)
- paymentId 중복 가능성

### 남은 블로커 (정확한 목록)

1. **PortOne 콘솔 확인 필요**: storeId와 channelKey가 같은 스토어 소속인지, 채널 활성 여부
2. **일반결제/정기결제 UI 분리 필요**: 화면 구조, 문구, 약관 블록 분리 (시설 엔터프라이즈 문의형은 이미 반영됨 — SubscriptionPlans.tsx:391)
3. **빌링키 발급 UI 미연결**: requestIssueBillingKey 함수는 추가됐으나 UI에서 호출하지 않음
4. **서버 자동결제/해지 플로우 미구현**: Edge Function, pg_cron, cancel_at_period_end 등
5. **개인 시그니처 9,900원 플랜 UI/로직 미반영**: 문서에는 확정됐으나 코드에 아직 없음
6. **더미 customer fallback 제거 필요**: 01000000000, user@memorimap.kr은 실연동 전 실제 사용자 정보 수집 흐름으로 교체해야 함

### 권장 진행 순서

1. KCP 테스트 채널로 **실기기 일반결제 1회 확인** (prepare/v2 400 해결 검증)
2. 성공하면 Phase B: 일반결제/정기결제 **UI 분리**
3. Phase C: 빌링키 발급 **UI 연결**
4. Phase D: 서버 자동결제/해지
## 12. Claude Execution Update (2026-03-26)

### Current Priority

- The top blocker is still: payment success toast appears, but DB writes remain `0` rows.
- Do not start Phase B/C/D before this path is made reliable.
- The immediate goal is to determine whether the failure is:
  - `verify-payment` not being called
  - `verify-payment` returning non-success
  - post-verification DB writes failing in the client flow
  - RLS / schema / `planId` mismatch

### Recent Safety Fixes Already Applied

- `lib/portone.ts`
  - `verifyPayment()` now treats non-200 Edge Function responses as failure instead of silently returning ambiguous JSON.
  - `requestPayment()` now actually passes `windowType` and `bypass` into the PortOne request body.
- `components/SubscriptionPlans.tsx`
  - If `updateFacilitySubscription()` fails, the flow now stops and does not show final success toast.
  - Console logging was added for facility subscription DB update failures.
- `components/PersonalSubscriptionPlans.tsx`
  - If `updatePersonalSubscription()` fails, the flow now stops and does not show final success toast.
  - Console logging was added for personal subscription DB update failures.
- `npm run typecheck`
  - Passed after the above fixes.

### Working Hypothesis

- `verify-payment` currently performs payment validation, but actual subscription/payment persistence still happens in the frontend via auth client calls.
- Because of that split responsibility, it is possible for:
  - payment validation to succeed
  - DB upsert/insert to fail
  - UI to previously still show success
- This matches the observed symptom very closely.

### Mandatory Investigation Order

1. Reproduce the payment once more after the latest safety fixes.
2. Check browser console for:
   - `[SubscriptionPlans] facility subscription DB update failed`
   - `[PersonalSubscriptionPlans] personal subscription DB update failed`
3. Confirm whether `verify-payment` returns `verified: true`.
4. Identify which exact DB write fails:
   - `facility_subscriptions` upsert
   - `user_subscriptions` upsert
   - `subscription_payments` insert
5. Verify RLS and schema alignment for those writes.

### Files To Inspect First

- `components/SubscriptionPlans.tsx`
- `components/PersonalSubscriptionPlans.tsx`
- `lib/portone.ts`
- `lib/queries.ts`
  - `updateFacilitySubscription`
  - `updatePersonalSubscription`
- `supabase/functions/verify-payment/index.ts`
- `supabase/migrations/20260325_pricing_v1_schema.sql`
- `supabase/migrations/20260325_facility_payments_insert_policy.sql`

### Required Checks

- `verifyPayment()` is actually called after payment completion.
- `verify-payment` responds with success and not hidden 4xx/5xx.
- `planId` values used by the client exactly match `subscription_plans.name_en`.
- `facility_subscriptions` and `user_subscriptions` upserts are allowed for the auth client under current RLS.
- `subscription_payments` inserts are allowed for:
  - `payment_context = 'personal'`
  - `payment_context = 'facility'`
- `updateFacilitySubscription()` UUID / bigint branching and `onConflict` target match the real schema.
- Final success toast only appears when DB persistence has also succeeded.

### Execution Rule For Claude

- Do not stop at analysis.
- Read the code, identify the exact failure point, and patch it.
- Keep the fix minimal and targeted.
- After patching, run verification where possible.
- Final response should include only:
  - cause
  - changed files
  - verification result
  - remaining risk

## 13. Claude Diagnosis Review (2026-03-26)

### Diagnosis Received

- High-confidence diagnosis from Claude:
  - `verify-payment` currently validates only.
  - Actual subscription/payment DB writes still happen in the client via auth client calls.
  - Those client-side writes are the most likely failure point behind the symptom:
    - payment success toast shown
    - DB rows remain `0`

### Suspected Failure Points

1. `facility_subscriptions` write path
   - current code uses upsert conflict target tied to facility subscription identity
   - schema / unique alignment may be incomplete
2. `user_subscriptions` write path
   - same risk for `user_id` conflict-based upsert
3. `subscription_plans` lookup ambiguity
   - `ilike('name_en', ...)` can match both legacy lowercase and active uppercase rows
   - this can cause `maybeSingle()` failure and skip payment history insert

### Additional Risk Called Out

- Migration review suggests no confirmed client RLS write path for:
  - `facility_subscriptions`
  - `user_subscriptions`
- If RLS is active without matching insert/update policies, auth client persistence will fail even when payment verification succeeds.

### Review Decision

- Approved direction:
  - move subscription/payment persistence into `verify-payment` Edge Function using `supabaseAdmin`
  - remove post-verification client DB writes from subscription UI flows
  - replace ambiguous `ilike('name_en', ...)` lookup with exact match

- Conditional / revised approval:
  - do **not** blindly add plain UNIQUE constraints first
  - before uniqueness hardening, check for duplicate existing rows
  - if needed, prefer partial unique indexes such as:
    - `facility_id_uuid IS NOT NULL`
    - `facility_id_bigint IS NOT NULL`
  - RLS hardening for `facility_subscriptions` / `user_subscriptions` is not required for the immediate payment fix if the Edge Function uses `service_role`
  - RLS expansion should be treated as a separate hardening step unless directly required

### Approved Execution Order

1. `verify-payment` Edge Function
   - after validation success, persist:
     - facility subscription state or personal subscription state
     - `subscription_payments` row
   - keep logic minimal and deterministic
2. `components/SubscriptionPlans.tsx`
   - remove client-side post-verification DB write dependency
   - rely on Edge Function result for final success handling
3. `components/PersonalSubscriptionPlans.tsx`
   - same as above
4. `lib/queries.ts`
   - change `subscription_plans` lookup from `ilike` to exact match as defensive cleanup
5. verification
   - typecheck / build
   - payment flow validation where possible

### Deferred Step

- uniqueness / RLS migration for subscription tables
  - only after duplicate data inspection
  - use partial unique index approach if schema hardening is needed

## 14. Claude Implementation Review (2026-03-26)

### Status

- Claude completed the main refactor direction:
  - subscription/payment persistence moved into `verify-payment` Edge Function
  - client-side post-verification DB writes removed from paid subscription flows
  - `subscription_plans.name_en` lookup changed from `ilike` to `eq`
  - `verifyPayment()` response type expanded with `persisted` / `subscriptionId`
- Reported verification:
  - `tsc --noEmit`: pass
  - `npm run build`: pass

### Review Outcome

- Deployment approval is **on hold** pending one more correction pass.
- The direction is correct, but two risks remain.

### Findings

1. Partial persistence risk still exists
   - In `verify-payment`, subscription state is written first and payment history is written after.
   - If payment history insert fails, the function returns `persisted: false`, but the subscription row may already remain `active`.
   - This creates a mismatch:
     - UI sees failure
     - DB may already be partially updated
   - This must be fixed before deployment approval.

2. Free-plan / cancellation path still relies on client write
   - Facility free transition still uses client-side `updateFacilitySubscription()`
   - Personal free transition still uses client-side `user_subscriptions` update
   - If the original issue family is client write / RLS related, these paths remain exposed.

### Required Next Pass

- Keep the current paid-flow refactor.
- Add one more correction pass before deploy:
  - remove partial persistence risk
  - review free-plan transition path

### Claude Follow-up Command

```md
추가 수정 후 다시 검증해라. 지금 상태로는 배포 승인 보류다.

우선 수정할 사항

1. `verify-payment` Edge Function의 subscription 저장 + payment history 저장을 부분 반영 없이 처리해라.
- 현재는 subscription update/insert 후 payment insert가 실패하면 `persisted: false`만 반환하고 subscription row는 이미 active로 남는다.
- 목표는 둘 중 하나다:
  - 둘 다 성공
  - 둘 다 반영되지 않음
- 가능하면 RPC/SQL function으로 묶어 atomic 하게 처리하고, 그게 어렵다면 최소한 payment insert 실패 시 subscription 변경을 롤백하는 명시 로직을 넣어라.
- facility/personal 둘 다 동일하게 적용해라.

2. 무료 전환 경로도 점검해라.
- `components/SubscriptionPlans.tsx`의 free 플랜 선택
- `components/PersonalSubscriptionPlans.tsx`의 PERSONAL_FREE 전환
- 이 경로가 여전히 auth client write에 의존하는데, 현재 결제 문제의 원인이 클라이언트 write/RLS 계열이라면 동일하게 깨질 수 있다.
- 최소한 이 리스크를 문서화하거나, 가능하면 same service-role/server path로 정리해라.

검증 기준

- `tsc --noEmit`
- `npm run build`
- 코드상으로 payment insert 실패 시 subscription 상태가 남지 않는지 설명
- 마지막 답변에는 아래만 적어라:
  - 남은 원자성 리스크가 제거됐는지
  - 무료 전환 경로 처리 여부
  - 변경 파일
  - 검증 결과
```

## 22. Claude Checkpoint After Flow Audit (2026-03-26)

### Audit Summary

- `verify-payment` Edge Function deployment readiness is acceptable.
- The Edge Function already covers:
  - paid facility subscription persistence
  - paid personal subscription persistence
  - facility free downgrade
  - personal free downgrade
  - rollback/compensation when payment-history persistence fails

### Frontend Flow Result

- `components/SubscriptionPlans.tsx`
  - paid flow uses `verify-payment` with `facility_subscription`
  - free downgrade uses `verify-payment` with `facility_free_downgrade`
- `components/PersonalSubscriptionPlans.tsx`
  - paid flow uses `verify-payment` with `personal_subscription`
  - free downgrade uses `verify-payment` with `personal_free_downgrade`
- Remaining issue:
  - `ContentRouter.tsx` still contains a client-side subscription write path triggered by `onSelectPlan`

### Confirmed Remaining Code Issue

- `SubscriptionPlans` already persists through the Edge Function.
- After that, `onSelectPlan?.(plan.id)` still triggers `ContentRouter.tsx` callback logic.
- That callback attempts `updateFacilitySubscription()` again on the client.
- Resulting risk:
  - duplicate subscription persistence attempt
  - client-side RLS/schema failure after server-side success
  - false failure toast shown to the user

### Required Code Cleanup

1. `ContentRouter.tsx`
   - remove the client-side `updateFacilitySubscription()` call from the `onSelectPlan` callback
   - keep only UI state update / toast logic that does not write subscription state again

2. `lib/portone.ts`
   - remove the temporary request debug log:
   - `console.warn('[PortOne DEBUG] requestBody:', JSON.stringify(requestBody, null, 2));`

### Claude Command

```md
점검 결과를 반영해 바로 수정 진행해 주세요.

핵심 판단:
- `verify-payment` Edge Function 경유 구조는 유료/무료 전환 모두 준비 완료 상태입니다.
- 현재 남은 코드 이슈는 `ContentRouter.tsx`의 잔존 클라이언트 write 입니다.
- `SubscriptionPlans` 내부에서 이미 EF를 통해 DB 반영이 끝난 뒤,
  `onSelectPlan?.(plan.id)` 호출로 `ContentRouter.tsx`가 `updateFacilitySubscription()`를 다시 호출하고 있습니다.
- 이 중복 클라이언트 write 때문에 RLS/스키마 조건에서 실패 토스트가 발생할 수 있습니다.
- 따라서 지금 수정 목표는 “중복 클라이언트 DB write 제거 + PortOne 디버그 로그 제거” 입니다.

수정 지시:
1. `ContentRouter.tsx`의 `onSelectPlan` 콜백에서 `updateFacilitySubscription()` 호출을 제거하세요.
2. 해당 콜백은 DB write 없이 UI 상태 갱신 또는 필요한 토스트 처리만 하도록 정리하세요.
3. `SubscriptionPlans`의 EF 기반 저장 흐름은 그대로 유지하세요.
4. `lib/portone.ts`의 아래 디버그 로그를 제거하세요.
   - `console.warn('[PortOne DEBUG] requestBody:', JSON.stringify(requestBody, null, 2));`

수정 대상:
- `ContentRouter.tsx` around `onSelectPlan` callback (`401-410` 부근)
- `lib/portone.ts` debug log 1건

중요:
- 다른 결제 흐름 구조는 건드리지 마세요.
- `verify-payment` EF 경유 paid/free 흐름은 유지하세요.
- 수정은 최소 범위로만 하세요.

검증:
- `tsc --noEmit`
- 가능하면 `npm run build`

최종 답변 형식:
- 원인
- 수정 파일
- 검증 결과
- 남은 리스크
```

## 21. PortOne Console Checkpoint Update (2026-03-26)

### Current Objective

- Stop further payment payload changes until PortOne console configuration is verified.
- The current priority is to determine whether `prepare/v2 400` is caused by console configuration mismatch rather than request-shape issues.

### PortOne Console Checklist

1. `결제대행사 관리 > 스토어`
   - Confirm the store matching `.env.local` `VITE_PORTONE_STORE_ID` exists.
   - Expected: same store exists and is active.

2. `해당 스토어 > 채널 목록`
   - Confirm `.env.local` `VITE_PORTONE_CHANNEL_KEY` belongs to that store.
   - Expected: the channel appears under the same store.

3. `해당 채널 > PG사`
   - Confirm the linked PG is `NHN KCP (v2)`.

4. `해당 채널 > 상태`
   - Confirm the channel status is active.
   - Expected: `활성` or `테스트`.

5. `해당 채널 > 결제수단`
   - Confirm `CARD` payment is enabled.

6. `테스트/라이브 모드`
   - Confirm the current store is test or live, and that the selected channel matches that mode.
   - Expected: if testing, use the test channel.

### Interpretation Rules

- If `prepare/v2 400` remains the same even after dummy customer fields have been removed, treat this as a configuration issue first.
- The strongest configuration candidates are:
  - `storeId` / `channelKey` mismatch
  - channel inactive or not fully linked
  - wrong test/live channel selection
- If `400` is resolved and the payment window opens normally, treat the removed dummy customer payload as the direct cause.
- If the payment window opens but payment approval fails later, treat it as a KCP contract-scope or test/live transition issue.

### Temporary Debug Code To Remove After Success

- Remove this line after live verification succeeds:
  - `lib/portone.ts`
  - `console.warn('[PortOne DEBUG] requestBody:', JSON.stringify(requestBody, null, 2));`

### Claude Command

```md
PortOne 설정 검증 작업을 이어서 진행해 주세요.

배경:
- 프로젝트는 `C:\Users\black\Desktop\memorimap`
- 현재 PortOne 결제 연동에서 `prepare/v2 400` 이 발생한 상태입니다.
- 원인 후보는 `customer` 더미 데이터 문제 또는 PortOne 콘솔 설정 불일치입니다.
- 코드상 임시 디버그 로그 1건이 남아 있으며, 테스트 성공 후 제거 대상입니다.

확인해야 할 PortOne 콘솔 항목:
1. 결제대행사 관리 > 스토어
- `.env.local`의 `VITE_PORTONE_STORE_ID` 와 동일한 스토어가 존재하는지 확인
- 기대값: 존재 + 활성 상태

2. 해당 스토어 > 채널 목록
- `.env.local`의 `VITE_PORTONE_CHANNEL_KEY` 가 이 스토어 하위 채널인지 확인
- 기대값: 같은 스토어 하위에 표시

3. 해당 채널 > PG사
- 채널이 NHN KCP 로 연결되어 있는지 확인
- 기대값: `NHN KCP (v2)`

4. 해당 채널 > 상태
- 채널이 활성 상태인지 확인
- 기대값: `활성` 또는 `테스트`

5. 해당 채널 > 결제수단
- CARD 결제가 허용되어 있는지 확인
- 기대값: 카드 결제 활성

6. 테스트/라이브 모드
- 현재 스토어가 테스트 모드인지 라이브 모드인지 확인
- 기대값: 테스트 중이면 테스트 채널 사용 확인

판단 기준:
- 더미 제거 후에도 `prepare/v2 400` 이 동일하면 설정 문제 확정
  - `storeId/channelKey` 불일치 또는 채널 비활성 가능성 높음
- `400` 이 해소되고 결제창이 정상 표시되면
  - 더미 `customer` 가 원인이었던 것으로 확정
  - 다음 단계는 DB 영속화 검증
- 결제창이 표시되지만 결제 실패 시
  - KCP 계약 범위 또는 테스트/라이브 전환 미완료 문제로 판단

테스트 성공 후 제거할 코드:
- 파일: `lib/portone.ts`
- 제거 대상 로그:
  `console.warn('[PortOne DEBUG] requestBody:', JSON.stringify(requestBody, null, 2));`

작업 방식:
1. 먼저 `.env.local`, `lib/portone.ts`, 결제 호출 흐름을 다시 확인해 주세요.
2. PortOne 설정 문제인지, payload 문제인지 현재 코드 기준으로 판단 근거를 정리해 주세요.
3. 내가 PortOne 콘솔에서 확인할 수 있도록 체크리스트를 다시 짧게 정리해 주세요.
4. 내가 콘솔 확인 결과를 보내면 그 결과를 바탕으로 다음 조치를 제안해 주세요.
5. 코드 수정이 필요하면 바로 수정안까지 제시해 주세요.
6. 최종 답변은 아래 형식으로 주세요:
- 현재 판단
- 확인할 항목
- 예상 원인
- 다음 액션
```

## 15. Claude Follow-up Verification Review (2026-03-26)

### Verification Result

- Claude applied the requested second-pass fixes.
- Local verification re-run in workspace:
  - `npm run typecheck`: pass
  - `npm run build`: pass

### What Was Confirmed

1. Partial persistence mitigation was added
   - `persistFacilitySubscription()` now captures previous subscription state and compensates on payment-history insert failure.
   - `persistPersonalSubscription()` now does the same for personal subscriptions.
   - Behavior is now:
     - subscription + payment history both succeed
     - or subscription change is compensated/rolled back before returning failure

2. Free downgrade paths were moved off client auth writes
   - facility free downgrade now goes through:
     - `paymentContext: 'facility_free_downgrade'`
     - Edge Function `handleFacilityFreeDowngrade()`
   - personal free downgrade now goes through:
     - `paymentContext: 'personal_free_downgrade'`
     - Edge Function `handlePersonalFreeDowngrade()`

3. Paid subscription UI flows still rely on `verify-payment` EF result
   - success requires `verified === true`
   - persistence failure is surfaced through `persisted === false`

### Review Decision

- Code review result: acceptable for next stage.
- Remaining note:
  - This is compensation-based rollback, not a true DB transaction.
  - Residual risk remains only if rollback itself fails after a payment-history insert failure.
  - That is acceptable for the current stage, but should be documented if this path is further hardened later.

### Next Operational Step

- Next step is no longer local refactor.
- Next step is deployment + real environment verification:
  1. deploy updated `verify-payment` Edge Function
  2. run real payment test for:
     - facility paid subscription
     - personal paid subscription
     - facility free downgrade
     - personal free downgrade
  3. confirm DB writes in:
     - `facility_subscriptions`
     - `user_subscriptions`
     - `subscription_payments`
  4. remove temporary PortOne debug logging after test confirmation

### Claude Next Command

```md
이제 구현 단계는 마무리됐다. 다음은 배포/실환경 검증 단계다.

작업 목표

1. `verify-payment` Edge Function 최신 코드 배포 준비 상태를 점검해라.
2. 실환경 검증 체크리스트를 짧고 실행 가능하게 정리해라.
3. 테스트 완료 후 제거해야 할 임시 디버그 코드를 식별해라.

우선 확인할 것

- `supabase/functions/verify-payment/index.ts`
- `lib/portone.ts`의 `console.warn('[PortOne DEBUG] ...')`
- 현재 프런트 paid/free downgrade 흐름이 모두 EF 경유인지 최종 확인

해야 할 일

1. 배포 전 확인 항목 정리
- 필요한 env / secret
- 배포 대상 함수명
- 배포 후 바로 확인할 응답 포인트

2. 실환경 테스트 체크리스트 작성
- 시설 유료 구독 결제
- 개인 유료 구독 결제
- 시설 무료 전환
- 개인 무료 전환
- 각 케이스마다 확인할 DB 테이블과 기대 결과

3. 테스트 후 제거할 임시 코드 정리
- PortOne request debug 로그
- 그 외 테스트 전용 로그가 있으면 함께 표시

중요

- 지금은 큰 코드 리팩터링을 더 하지 말아라.
- 배포/실결제 검증에 필요한 최소 정리만 해라.
- 마지막 답변에는 아래만 적어라:
  - 배포 준비 상태
  - 실환경 테스트 체크리스트
  - 제거할 임시 디버그 코드
```

## 16. Claude Deployment And Live Verification Command (2026-03-26)

### Deployment Readiness

- Edge Function deployment target:
  - `verify-payment`
- Deployment command:
  - `supabase functions deploy verify-payment`
- Required environment / secret checks:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `PORTONE_API_SECRET`
- Fast post-deploy checks:
  - `OPTIONS` request returns `204`
  - invalid token `POST` returns `401`

### Frontend Flow Confirmation

- `components/SubscriptionPlans.tsx`
  - paid flow uses `verifyPayment()`
  - free downgrade also uses `verifyPayment()`
- `components/PersonalSubscriptionPlans.tsx`
  - paid flow uses `verifyPayment()`
  - free downgrade also uses `verifyPayment()`
- direct client-side subscription persistence calls are no longer part of the active paid/free flow

### Live Test Checklist

1. Facility paid subscription
   - action:
     - purchase `라이트 (49,000)`
   - confirm DB:
     - `facility_subscriptions.plan_id = 'basic'`
     - `facility_subscriptions.status = 'active'`
     - `subscription_payments.payment_context = 'facility'`
     - `subscription_payments.amount = 49000`
     - `subscription_payments.status = 'completed'`

2. Personal paid subscription
   - action:
     - purchase `프리미엄 (4,900)`
   - confirm DB:
     - `user_subscriptions.plan_id = 'PERSONAL_PREMIUM'`
     - `user_subscriptions.status = 'active'`
     - `subscription_payments.payment_context = 'personal'`
     - `subscription_payments.amount = 4900`
     - `subscription_payments.status = 'completed'`

3. Facility free downgrade
   - action:
     - select `무료체험`
   - confirm DB:
     - `facility_subscriptions.plan_id = 'free'`
     - `facility_subscriptions.status = 'active'`
     - no new `subscription_payments` row

4. Personal free downgrade
   - action:
     - select `무료`
   - confirm DB:
     - `user_subscriptions.plan_id = 'PERSONAL_FREE'`
     - `user_subscriptions.status = 'active'`
     - no new `subscription_payments` row

5. Payment cancellation
   - action:
     - open payment window, cancel before completion
   - confirm DB:
     - no changes in related subscription/payment tables

### Temporary Debug Code To Remove After Validation

- `lib/portone.ts`
  - `console.warn('[PortOne DEBUG] requestBody:', JSON.stringify(requestBody, null, 2));`

### Claude Execution Command

```md
이제 배포 및 실환경 검증 단계로 진행해라.

작업 순서
1. `verify-payment` Edge Function 배포
2. 아래 5개 케이스를 실환경 기준으로 검증
3. 테스트가 끝나면 `lib/portone.ts`의 `console.warn('[PortOne DEBUG] ...')` 제거
4. 마지막으로 `tsc --noEmit`와 `npm run build` 재검증

실환경 검증 케이스
1. 시설 유료 구독 결제
- 기대:
  - `facility_subscriptions.plan_id = 'basic'`
  - `facility_subscriptions.status = 'active'`
  - `subscription_payments.payment_context = 'facility'`
  - `subscription_payments.amount = 49000`
  - `subscription_payments.status = 'completed'`

2. 개인 유료 구독 결제
- 기대:
  - `user_subscriptions.plan_id = 'PERSONAL_PREMIUM'`
  - `user_subscriptions.status = 'active'`
  - `subscription_payments.payment_context = 'personal'`
  - `subscription_payments.amount = 4900`
  - `subscription_payments.status = 'completed'`

3. 시설 무료 전환
- 기대:
  - `facility_subscriptions.plan_id = 'free'`
  - `facility_subscriptions.status = 'active'`
  - `subscription_payments` 신규 row 없음

4. 개인 무료 전환
- 기대:
  - `user_subscriptions.plan_id = 'PERSONAL_FREE'`
  - `user_subscriptions.status = 'active'`
  - `subscription_payments` 신규 row 없음

5. 결제창 취소
- 기대:
  - 모든 관련 테이블 변경 없음

중요
- 실패 시 어느 케이스에서 막혔는지와 실제 DB 상태를 같이 보고해라.
- 테스트 완료 전에는 추가 리팩터링 하지 말아라.
- 마지막 답변에는 아래만 적어라:
  - 배포 성공 여부
  - 케이스별 통과/실패
  - 실제 DB 확인 결과
  - 제거한 디버그 코드
  - 최종 typecheck/build 결과
```

## 17. Live Console Error Evidence (2026-03-26)

### Newly Captured Console Evidence

- React DevTools recommendation message
  - informational only
  - not related to payment failure

- Supabase auth lock warning
  - message:
    - `Lock "lock:sb-xvmpvzldezpoxxsarizm-auth-token" was not released within 5000ms`
  - current assessment:
    - likely non-blocking warning
    - may indicate Strict Mode / abandoned lock recovery
    - not the primary payment blocker based on current trace

- PortOne debug request body was captured
  - observed request included:
    - `storeId`
    - `channelKey`
    - `paymentId`
    - `orderName`
    - `totalAmount`
    - `currency`
    - `payMethod`
    - `windowType`
    - `bypass.kcp_v2.site_name = '추모맵'`
    - `customer.fullName`
    - `customer.phoneNumber = '01000000000'`
    - `customer.email`

- Actual blocking error still present
  - request:
    - `POST https://checkout-service.prod.iamport.co/api/prepare/v2`
  - result:
    - `400 (Bad Request)`
  - call path:
    - `PersonalSubscriptionPlans.tsx`
    - `lib/portone.ts`
    - PortOne browser SDK `prepare/v2`

### Meaning Of This Evidence

- This proves the current blocker has moved earlier than DB persistence.
- The payment request is failing before `verify-payment` / Edge Function / DB stages.
- Therefore:
  - subscription persistence refactor may be correct
  - but live payment is still blocked by PortOne/KCP request validation at `prepare/v2`

### Current Working Interpretation

- `prepare/v2 400` remains unresolved in the live path.
- The request body now includes the previously suspected fields, so the remaining issue is likely one of:
  - KCP / PortOne test channel configuration mismatch
  - field-level validation still rejected by KCP despite request shape looking correct
  - customer fallback data such as `01000000000` being unacceptable in live validation
  - another required request field or channel/store relationship issue not visible from the current frontend log

### Updated Priority

1. Resolve `prepare/v2 400`
2. Only after that, continue live payment verification for DB persistence
3. Keep the DB-persistence refactor in place; it is no longer the immediate blocker

### Claude Follow-up Command For This Error

```md
실환경 콘솔 로그 기준으로 우선순위를 수정해라. 지금 최우선 블로커는 DB가 아니라 `prepare/v2 400`이다.

새로 확인된 사실

- PortOne request body는 현재 다음 필드를 포함하고 있다:
  - `storeId`
  - `channelKey`
  - `paymentId`
  - `orderName`
  - `totalAmount`
  - `currency`
  - `payMethod`
  - `windowType`
  - `bypass.kcp_v2.site_name`
  - `customer.fullName`
  - `customer.phoneNumber`
  - `customer.email`
- 그럼에도 실제 브라우저 SDK 단계에서:
  - `POST /api/prepare/v2`
  - `400 Bad Request`
- 따라서 현재 차단점은 EF/DB 이전 단계다.

이번 작업 목표

1. `prepare/v2 400`의 남은 원인을 코드/설정 기준으로 재분석
2. 현재 request body에서 어떤 필드가 KCP live/test 규칙과 충돌하는지 추정이 아니라 코드 근거로 좁히기
3. 필요하면 request body를 더 줄이거나 fallback 값을 제거하는 방향으로 최소 수정안 제시

우선 확인할 것

- `lib/portone.ts`
- `components/PersonalSubscriptionPlans.tsx`
- `components/SubscriptionPlans.tsx`
- env 사용 방식 (`STORE_ID`, `CHANNEL_KEY`, `BILLING_CHANNEL_KEY`)
- 문서:
  - `docs/01-plan/portone_nhn_kcp_direction_20260325.md`
  - `docs/01-plan/billing_key_recurring_payment_plan.md`
  - `docs/04-report/work_log_20260325_pricing_v1.md`

추가로 꼭 판단할 항목

- `01000000000` fallback phone이 live/test KCP 검증에서 거절될 가능성
- `customer.email` 또는 `customer.phoneNumber`를 아예 보내지 않는 편이 더 안전한지
- `windowType` / `bypass` 포함 상태가 현재 KCP 경로와 맞는지
- `storeId` 와 `channelKey` 조합이 실제 동일 상점 기준으로 맞는지

중요

- 지금은 DB persistence 쪽을 더 수정하지 말아라.
- 최우선은 `prepare/v2 400`을 없애는 것이다.
- 마지막 답변에는 아래만 적어라:
  - `prepare/v2 400`의 가장 가능성 높은 원인
  - 수정해야 할 최소 코드/설정
  - 테스트할 다음 요청 형태
```

## 18. KCP v2 Clarification And Claude Command (2026-03-26)

### Clarified Interpretation

- Current code is already shaped for `NHN KCP v2` general payment:
  - `PortOne.requestPayment()`
  - `bypass.kcp_v2.site_name`
  - `windowType`
  - `storeId + channelKey`
- `requestIssueBillingKey()` is also prepared in code, so the codebase is not “missing KCP v2 awareness”.

- However, current subscription purchase flow is still:
  - `requestPayment()`
  - `getChannelKey('general')`
  - one-time payment
- It is **not yet** the full KCP v2 billing-key recurring flow.

- Therefore the correct reading is:
  - this is **not** “KCP v2 is not configured”
  - this is “a KCP v2-style general payment request is being sent, but `prepare/v2 400` is still occurring”

### Updated Diagnostic Focus

- Do not broadly claim the whole KCP v2 setup is wrong.
- Narrow the failure to specific request fields or channel/store configuration.
- The likely issue is now one of:
  - rejected fallback customer data
  - field combination rejected by KCP
  - mismatched `storeId` / `channelKey`
  - using the wrong test/live/general/billing channel for the current flow

### Claude Command

```md
지금 판단 기준을 명확히 한다.

현재 코드는 “NHN KCP v2 일반결제 형태”로는 맞춰져 있다.
- `requestPayment()`
- `bypass.kcp_v2.site_name`
- `windowType`
- `storeId + channelKey`
- `requestIssueBillingKey()` 준비

하지만 현재 구독 결제 흐름은 아직 `requestIssueBillingKey()` 기반 정기결제가 아니라,
`getChannelKey('general') + requestPayment()` 기반 1회 결제다.

즉 지금 이슈는
- “KCP v2로 안 맞췄다”가 아니라
- “KCP v2 일반결제 요청을 보내고 있는데 prepare/v2 400이 난다”는 것이다.

이번 작업 목표
1. `prepare/v2 400`의 실제 원인을 KCP v2 일반결제 기준에서 다시 좁혀라.
2. DB/EF 쪽은 잠시 건드리지 말고, 프런트 payment request 파라미터와 env/채널 설정만 보라.
3. 최소 수정안만 제시하거나 바로 반영해라.

우선 봐야 할 것
- `lib/portone.ts`
- `components/PersonalSubscriptionPlans.tsx`
- `components/SubscriptionPlans.tsx`
- `docs/01-plan/portone_nhn_kcp_direction_20260325.md`

반드시 판단할 항목
- `customer.phoneNumber = "01000000000"` fallback 이 KCP에서 거절될 가능성
- `customer.email` / `customer.phoneNumber`를 아예 생략하는 편이 더 안전한지
- `windowType`이 현재 KCP 경로에서 필요한지
- `bypass.kcp_v2.site_name` 값이 현재 상점/심사 기준과 충돌하는지
- `storeId` 와 `channelKey`가 실제 같은 KCP 상점 기준으로 연결된 값인지
- 구독 결제인데 아직 `general` 채널을 쓰는 것이 현재 테스트 채널 구성과 맞는지

중요
- “KCP v2 설정이 틀렸다”처럼 뭉뚱그리지 말고,
  어떤 필드/설정 조합이 prepare/v2 400을 유발하는지 가장 가능성 높은 원인을 1~2개로 좁혀라.
- 가능하면 다음 테스트용 요청 형태를 제안해라.
- 마지막 답변에는 아래만 적어라:
  - 가장 가능성 높은 원인
  - 바로 바꿔볼 최소 코드
  - 다음 테스트 request shape
```

## 19. Minimal Request Narrowing Hypothesis (2026-03-26)

### Most Likely Cause Of `prepare/v2 400`

- The strongest current hypothesis is:
  - dummy customer fallback values are being rejected by KCP validation
- suspected values:
  - `01000000000`
  - `user@memorimap.kr`
  - `partner@memorimap.kr`

- Important observation:
  - recent live tests were still using these fallback values
  - current `lib/portone.ts` already strips empty-string customer fields
  - therefore the smallest safe experiment is:
    - keep `customer.fullName`
    - remove fallback phone/email from the actual request

### Minimal Code Change Direction

- `components/PersonalSubscriptionPlans.tsx`
  - change fallback:
    - phone: `"01000000000"` → `""`
    - email: `"user@memorimap.kr"` → `""`

- `components/SubscriptionPlans.tsx`
  - change fallback:
    - phone: `"01000000000"` → `""`
    - email: `"partner@memorimap.kr"` → `""`

- expected effect:
  - `lib/portone.ts` customer filtering removes empty values
  - KCP request will contain only:
    - `customer.fullName`

### Next Test Request Shape

```json
{
  "storeId": "...",
  "channelKey": "...",
  "paymentId": "psub_xxx",
  "orderName": "[추모맵] 개인 프리미엄 플랜",
  "totalAmount": 4900,
  "currency": "KRW",
  "payMethod": "CARD",
  "windowType": { "pc": "IFRAME", "mobile": "POPUP" },
  "bypass": { "kcp_v2": { "site_name": "추모맵" } },
  "customer": { "fullName": "사용자 이름" }
}
```

### Interpretation Rule

- If this narrowed request still returns `prepare/v2 400`,
  the next most likely issue becomes:
  - `storeId` / `channelKey` mismatch
  - PortOne console channel linkage
  - test/live environment mismatch

### Claude Command

```md
좋다. 그 방향으로 바로 수정하고 다시 테스트해라.

작업
1. `PersonalSubscriptionPlans.tsx`
- fallback `phoneNumber`, `email`을 더미값 대신 빈 문자열로 바꿔라.

2. `SubscriptionPlans.tsx`
- fallback `phoneNumber`, `email`을 더미값 대신 빈 문자열로 바꿔라.

의도
- `lib/portone.ts`의 빈값 필터를 통해 KCP에 `customer.fullName`만 보내는 요청 형태로 축소한다.
- 지금 단계에서는 다른 필드는 건드리지 말아라.

테스트
- 결제 재시도 후 `PortOne DEBUG` request body를 확인해라.
- `customer`에 `fullName`만 남았는지 확인해라.
- 결과를 아래 형식으로만 보고해라:
  - 수정 파일
  - 실제 request body shape
  - `prepare/v2 400` 해소 여부
  - 미해결이면 다음 원인 후보 (`storeId/channelKey` 여부)
```

## 20. PortOne Console Verification Command (2026-03-26)

### Current Status

- The minimal request-narrowing code change has already been applied.
- Current expected request shape is:
  - `customer.fullName` only
  - no fallback `phoneNumber`
  - no fallback `email`
- Local build/typecheck status is already acceptable.
- `prepare/v2 400` resolution is still **not yet confirmed** until live device testing.

### Next Most Likely Cause If 400 Persists

- `storeId` / `channelKey` linkage problem in PortOne console
- same-store mismatch between configured store and selected channel
- wrong channel for current KCP test/live flow

### Updated Priority

- Stop further code tweaking for now.
- Move to operational configuration verification in PortOne console.

### Claude Command

```md
좋다. 코드상 최소 수정은 반영된 것으로 본다.

이제 다음 단계는 코드 수정이 아니라 운영 설정 검증이다.

작업 목표
1. PortOne 콘솔 기준으로 `storeId` 와 `channelKey` 연결 관계를 확인할 체크리스트를 정리해라.
2. 실기기 테스트 시 어떤 결과가 나오면 설정 문제로 확정할 수 있는지 정리해라.
3. 테스트 성공 후 제거할 임시 디버그 코드도 다시 확인해라.

중요
- 더 이상의 코드 수정은 잠시 멈춰라.
- 지금은 PortOne/KCP 콘솔 설정 검증 단계다.
- 마지막 답변에는 아래만 적어라:
  - PortOne 콘솔에서 확인할 항목
  - 설정 문제로 판단하는 기준
  - 테스트 성공 후 제거할 코드
```
