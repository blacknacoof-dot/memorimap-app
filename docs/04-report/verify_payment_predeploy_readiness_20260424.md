# Verify Payment Predeploy Readiness

Updated: 2026-04-24
Scope: no deploy, no production mutation, code-and-test readiness only

## Status

- `구현 완료 / 검증 필요`
  - `verify-payment` Edge Function 인증, rate limit, 소유권 검증, 결제 영속화 분기는 코드상 존재
  - 프론트엔드 호출부에서 Bearer 토큰을 포함해 `verify-payment`를 호출함
  - 인증 없는 호출 차단 E2E와 보안 contract 테스트가 존재함
- `구현 완료 / 자동화 미흡`
  - 실배포 최신본이 현재 코드와 일치하는지 확인은 아직 남아 있음
  - 실결제 기준 happy path와 downgrade path는 운영 검증이 필요함

## Code Check Summary

### Edge Function entry

- File: `supabase/functions/verify-payment/index.ts`
- 확인 항목
  - 허용 origin에 `https://memorimap.kr` 포함
  - Authorization header 필수
  - JWT 검증 실패 시 `401`
  - rate limit 적용: `endpoint: 'verify-payment'`, `maxRequests: 20`, `windowSeconds: 60`
  - service role client로 DB 영속화 수행

### Payment ownership and persistence

- 시설 구독
  - `verifyFacilityOwnership()`에서 `facilities.user_id` 직접 소유 확인
  - `sangjo_hq_admins` 경유 소유 확인 포함
  - plan 존재 여부와 facility ownership 둘 다 통과해야 영속화
- 개인 구독
  - `targetUserId === verifiedUserId` 검사
  - plan 존재 여부와 사용자 본인 여부 둘 다 통과해야 영속화
- payment intent
  - `payment_intents` 조회 및 상태 업데이트 경로 존재
  - `paid`, `failed`, `cancelled`, `sync_required` 상태를 사용

### Frontend caller

- File: `lib/portone.ts`
- 확인 항목
  - `verifyPayment()`가 현재 access token을 읽어서 Authorization Bearer로 전달
  - 응답이 non-2xx면 `verified: false`로 정리
  - `registerPaymentIntent()`도 동일한 auth 전제를 사용

## Existing Automated Coverage

### E2E

- File: `tests/e2e/auth.edgeFunctions.spec.ts`
- 확인 항목
  - `AUTH-EDGE-6`: 인증 없는 `verify-payment` 호출이 business logic 이전에 `401`로 차단됨

### Static security contract

- File: `tests/security/edgeContracts.spec.ts`
- 확인 항목
  - rate limit import 및 설정값 존재
  - `429` + `Retry-After` 처리 존재
  - 외부 응답에 내부 auth detail 누출 금지

## Predeploy Checklist

- [x] `verify-payment` 호출부가 Authorization Bearer 토큰을 포함한다
- [x] `verify-payment` Edge Function이 Authorization header 누락 시 `401`을 반환한다
- [x] `verify-payment` Edge Function에 rate limiting이 존재한다
- [x] `verify-payment` Edge Function이 시설/개인 구독 소유권 검증을 수행한다
- [x] `payment_intents` 연동 경로가 코드에 존재한다
- [x] `https://memorimap.kr`가 허용 origin 목록에 포함되어 있다
- [ ] Supabase Dashboard의 마지막 배포 시각이 현재 코드 반영 이후인지 확인
- [ ] 운영 환경 변수 `PORTONE_API_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` 상태 확인
- [ ] 실배포 happy path: 개인 구독 결제 후 `verified: true`, `persisted: true`
- [ ] 실배포 happy path: 시설/상조 구독 결제 후 상태 반영 확인
- [ ] 실배포 downgrade path: free downgrade가 `verify-payment` 경유로 반영되는지 확인
- [ ] 운영 로그에서 `facilityOwned=false`, `planExists=false`, persistence failure 재발 여부 확인

## PowerShell Verification Order

1. Supabase Dashboard에서 `verify-payment` 마지막 배포 시각 확인
2. Edge Function 환경 변수 확인
3. 개인 구독 결제 성공 경로 확인
4. 시설 또는 상조 구독 결제 성공 경로 확인
5. free downgrade 경로 확인
6. 실패 시 `system_logs`와 payment/subscription row 기준으로 verify vs persist 분리 확인

## Interpretation Rules

- `verified: false`
  - 인증, PortOne 검증, 소유권 검증, plan 검증 중 하나에서 실패한 상태
- `verified: true`, `persisted: false`
  - 결제 검증은 통과했지만 subscription/payment DB 반영에서 실패한 상태
- `verified: true`, `persisted: true`
  - 릴리스 판단 기준상 정상 성공
