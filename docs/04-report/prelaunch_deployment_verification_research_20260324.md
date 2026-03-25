# Memorimap 출시 전 전체 배포 검증 리서치 보고서

- 작성일: 2026-03-24
- 기준 브랜치: `dev`
- 기준 커밋: `e31ec26`
- 기준 문서:
  - `Memorimap 출시 전 전체 배포 검증 프롬프트.txt`
  - `docs/LAUNCH_VERIFICATION_FRAMEWORK.md`
  - `docs/PRELAUNCH_CROSSCHECK.md`
  - `docs/LAUNCH_READINESS_REPORT.md`
  - `docs/qa_executable_master_20260320.txt`

## 1. 결론

현재 코드베이스는 핵심 출시 흐름 상당수가 자동 검증 기준에서 통과했고, 로컬 빌드도 정상입니다. 다만 출시 전 전체 배포 검증 프롬프트 기준으로 보면 "요금제/결제만 개선하면 바로 안전하게 운영 가능"이라고 단정하기는 어렵습니다.

이유는 두 가지입니다.

1. 현재 자동화가 실제 PortOne 실결제와 production 도메인 CORS까지 검증하지는 않습니다.
2. 구독 결제 검증 로직은 예약 결제에 비해 서버측 소유권 검증이 약합니다.

즉, 일반 탐색/예약/리뷰/AI 비교/관리자 승인 같은 핵심 웹 기능은 현 시점에서도 상당히 usable한 상태지만, 출시 판정에서는 결제와 배포 환경 경계 조건을 별도 차단 항목으로 봐야 합니다.

## 2. 이번 실행 범위

### 정적 검증

- `npm run typecheck`
- `npm run build`

### Playwright 실행

- `npx playwright test tests/e2e/core.flows.spec.ts --reporter=line --workers=1`
- `npx playwright test tests/e2e/subscription.flow.spec.ts --reporter=line --workers=1`
- `npx playwright test tests/e2e/report.smoke.spec.ts --reporter=line --workers=1`
- `npx playwright test tests/e2e/superAdmin.partnerStatus.spec.ts --reporter=line --workers=1`
- `npx playwright test tests/e2e/ai.compare.spec.ts --reporter=line --workers=1`
- `npx playwright test tests/e2e/facilityAdmin.confirmReservation.spec.ts --reporter=line --workers=1`

## 3. 실행 결과 요약

### 빌드 및 타입

- `typecheck`: 통과
- `build`: 통과
- 산출물:
  - `dist/assets/index-7bU2-GD8.js`
  - `dist/assets/index-CL3AE2IR.css`

### E2E/고위험 흐름

- `core.flows.spec.ts`: 7/7 통과
  - 로그인
  - 예약 생성
  - 예약 결제 반영
  - 리뷰 생성
  - 관리자 알림 deep link
  - 계정 전환 및 super-admin 가드
  - 공유 비밀번호 rate limit
- `subscription.flow.spec.ts`: 2/2 통과
  - free -> premium -> free canonical plan 유지
  - 현재 플랜 재선택 no-op
- `report.smoke.spec.ts`: 3/3 통과
  - unauthorized 차단
  - 상조 활성 구독 없음 no-op
  - 활성 상조 구독 시 리포트 payload 생성
- `superAdmin.partnerStatus.spec.ts`: 4/4 통과
  - suspend / reject / resume / 목록 액션
- `ai.compare.spec.ts`: 3/3 통과
  - 긴급 AI 검색 -> 예약 연결
  - 시설 비교 -> 예약 이동
  - 상조 비교 -> 상세 이동
- `facilityAdmin.confirmReservation.spec.ts`: 2/2 통과
  - 시설관리자 예약 승인
  - 타 시설 예약 승인 RLS 방어

총 실행 결과: `21 passed`

## 4. 출시 차단(Blocker) 관점 핵심 판단

### Blocker 1. `verify-payment` CORS 허용 도메인에 `memorimap.kr`가 없다

- 파일: [supabase/functions/verify-payment/index.ts](/C:/Users/black/Desktop/memorimap/supabase/functions/verify-payment/index.ts#L4)
- 상세:
  - 허용 origin은 `memorimap-app.vercel.app`, `memorimap.com`, `www.memorimap.com`만 포함합니다.
  - 실제 production alias는 앞선 배포 확인 기준 `memorimap.kr`를 사용 중이었습니다.
  - 따라서 브라우저에서 `https://memorimap.kr` origin으로 `verify-payment`를 호출하면 CORS 문제가 발생할 가능성이 높습니다.
- 영향:
  - 예약 결제 검증
  - 시설/개인 구독 결제 검증
- 판단: `출시 차단 가능성 높음`

### Blocker 2. 구독 결제는 서버에서 "무슨 구독 결제인지"까지 검증하지 않는다

- 파일: [components/SubscriptionPlans.tsx](/C:/Users/black/Desktop/memorimap/components/SubscriptionPlans.tsx#L288)
- 파일: [components/PersonalSubscriptionPlans.tsx](/C:/Users/black/Desktop/memorimap/components/PersonalSubscriptionPlans.tsx#L212)
- 파일: [supabase/functions/verify-payment/index.ts](/C:/Users/black/Desktop/memorimap/supabase/functions/verify-payment/index.ts#L168)
- 상세:
  - 시설/개인 구독 결제 검증 호출은 `paymentId`, `expectedAmount`만 전달합니다.
  - Edge Function은 `orderId`가 있을 때만 예약 row 소유권과 금액을 추가 검증합니다.
  - 구독 결제는 `orderId` 또는 subscription target 정보가 없어서 서버가 "이 결제가 어떤 구독 row를 위한 것인지"를 검증하지 못합니다.
- 의미:
  - 현재 구독 결제 검증은 사실상 `금액 + PortOne 상태` 중심입니다.
  - 예약 결제 수준의 소유권/대상 정합성 검증은 아닙니다.
- 판단: `출시 차단 또는 최소 출시 전 보강 권고`

### Blocker 3. 결제 성공 후 구독 반영이 분리되어 있어 부분 실패가 가능하다

- 파일: [components/SubscriptionPlans.tsx](/C:/Users/black/Desktop/memorimap/components/SubscriptionPlans.tsx#L298)
- 파일: [components/PersonalSubscriptionPlans.tsx](/C:/Users/black/Desktop/memorimap/components/PersonalSubscriptionPlans.tsx#L222)
- 파일: [lib/queries.ts](/C:/Users/black/Desktop/memorimap/lib/queries.ts#L1433)
- 상세:
  - PortOne 검증 성공 후 별도 DB 갱신 단계가 뒤따릅니다.
  - 시설 구독은 `updateFacilitySubscription(...)`가 후행 호출됩니다.
  - 개인 구독은 `user_subscriptions.upsert(...)`가 후행 호출됩니다.
  - 이 단계가 실패하면 "실제 결제는 되었는데 구독 반영이 실패"하는 상태가 발생할 수 있습니다.
- 판단: `운영 리스크 높음`

## 5. 주의(High Risk but not immediate blocker)

### 5-1. 현재 구독 시스템은 월 결제 전제다

- 파일: [lib/queries.ts](/C:/Users/black/Desktop/memorimap/lib/queries.ts#L1469)
- 상세:
  - `updateFacilitySubscription(...)`는 다음 청구일을 무조건 `+1 month`로 계산합니다.
  - `subscription_payments` 기록도 월 billing period를 전제로 생성합니다.
- 의미:
  - 현재 출시 상태는 "월 결제형"으로는 일관성이 있습니다.
  - 하지만 연 결제/계약형 요금제 개편 문서 범위를 구현한 상태는 아닙니다.
- 판단: `요금제 개편 미반영 상태`

### 5-2. 자동화된 결제 테스트는 PortOne 실연동이 아니라 스텁이다

- 파일: [tests/e2e/core.flows.spec.ts](/C:/Users/black/Desktop/memorimap/tests/e2e/core.flows.spec.ts#L29)
- 파일: [tests/e2e/subscription.flow.spec.ts](/C:/Users/black/Desktop/memorimap/tests/e2e/subscription.flow.spec.ts#L32)
- 파일: [tests/e2e/qa.execution.spec.ts](/C:/Users/black/Desktop/memorimap/tests/e2e/qa.execution.spec.ts#L17)
- 상세:
  - 테스트는 PortOne SDK와 `verify-payment` 응답을 route fulfill로 스텁합니다.
  - 따라서 실 PG 연동, 실 origin, 실 secret, 실 결제취소/실패 콜백은 이번 자동화 통과만으로 증명되지 않습니다.
- 판단: `운영 전 수동 실결제 검증 필요`

### 5-3. 시설/개인 구독 이력 적재 전략이 비대칭적이다

- 파일: [lib/queries.ts](/C:/Users/black/Desktop/memorimap/lib/queries.ts#L1506)
- 파일: [components/PersonalSubscriptionPlans.tsx](/C:/Users/black/Desktop/memorimap/components/PersonalSubscriptionPlans.tsx#L227)
- 상세:
  - 시설 구독은 `subscription_payments` row 기록 로직이 있습니다.
  - 개인 구독은 `user_subscriptions` upsert는 하지만 동일 수준의 payment ledger가 코드상 직접 보이지 않습니다.
- 판단: `운영 추적성 부족 가능성`

## 6. 이번 검증으로 확인된 강점

- 권한 가드:
  - super-admin route 보호
  - 타 시설 예약 RLS 방어
  - 관리자 승인 플로우 정상
- 핵심 사용자 흐름:
  - 로그인
  - 예약 생성
  - 예약 후 마이페이지 반영
  - 리뷰 생성
  - AI 비교/긴급 예약 연결
- 관리자 운영 흐름:
  - 시설관리자 예약 승인
  - super-admin 파트너 상태 변경
  - 상조 월간 리포트 스모크
- 구독 데이터 정합성:
  - 시설 구독 `plan_id` canonical 유지
  - free/premium 전환 후 single row 유지

## 7. 이번 검증의 한계

이번 실행은 "코드베이스와 로컬/테스트 환경" 기준입니다. 아래는 아직 직접 증명되지 않았습니다.

- 실제 production origin `memorimap.kr`에서의 브라우저 결제 검증 호출 성공
- PortOne 실결제 승인/실패/취소 케이스
- Supabase Edge Function production env secret 누락 여부
- 연간 결제 / 할인 / 계약형 개편 로직
- iOS Safari safe-area / in-app browser 실기기 확인
- production 관측:
  - Sentry 등 에러 수집
  - 실시간 로그
  - 배포 직후 10분/1시간/24시간 모니터링

## 8. 출시 판정

### 현재 판정

- `조건부 가능`

### 조건

1. `verify-payment` CORS 허용 origin에 `https://memorimap.kr`를 추가
2. 구독 결제 검증 payload를 예약 결제 수준으로 강화
   - 예: `subscriptionTargetType`, `facilityId` 또는 `userId`, `planId`, `billingCycle`
   - 서버에서 실제 대상 row와 요청 주체를 검증
3. 실운영 PortOne으로 최소 1회씩 수동 검증
   - 예약 결제 성공
   - 시설 구독 결제 성공
   - 개인 구독 결제 성공
   - 결제 실패/취소

### 해석

- 결제/요금제 영역을 제외하면 웹 서비스 핵심 플로우는 현재도 꽤 안정적입니다.
- 하지만 실제 출시 판정에서 결제는 주변 기능이 아니라 핵심 신뢰 경계라서, "요금제 부분만 나중에 보면 된다"로 처리하기는 어렵습니다.

## 9. 바로 다음 권장 작업

1. `supabase/functions/verify-payment/index.ts`에 `memorimap.kr` origin 추가
2. 구독 결제 검증 payload/서버 검증 설계 문서화
3. 실결제 smoke checklist 작성 후 production 또는 staging 유사 환경에서 수행
4. 검증 후 이 문서를 `최종 출시 판단서`로 업데이트
