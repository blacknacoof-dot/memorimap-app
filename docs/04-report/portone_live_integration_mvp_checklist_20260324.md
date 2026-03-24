# PortOne Live Integration MVP Checklist

작성일: 2026-03-24  
범위: 현재 월 구독 구조를 유지한 채 PortOne 실연동을 붙이기 위한 최소 수정 체크리스트

## 1. 목적

이 문서는 요금제 개편 전체가 아니라, **현재 월 구독 결제 구조를 실제 PortOne 실결제로 연결하는 것**만 목표로 한다.

즉 이번 범위는 아래에 한정한다.

- 개인 구독 월 결제
- 시설 구독 월 결제
- 결제 성공 후 서버 검증
- 구독 상태 반영
- 결제 이력 저장

이번 범위에 포함하지 않는 것:

- 연간 결제
- 할인 로직
- `billing_cycle` 추가
- 상조 계약형 전환

## 2. 현재 코드 기준 상태

이미 구현된 요소:

- 프론트 PortOne 요청 함수 존재: `lib/portone.ts`
- 시설 구독 결제 UI 존재: `components/SubscriptionPlans.tsx`
- 개인 구독 결제 UI 존재: `components/PersonalSubscriptionPlans.tsx`
- 서버 검증 Edge Function 존재: `supabase/functions/verify-payment/index.ts`
- 시설 구독 갱신 함수 존재: `lib/queries.ts`

즉 완전 신규 구축이 아니라, **실운영용 누락 포인트를 보완하는 작업**에 가깝다.

## 3. 최소 완료 조건

아래가 모두 만족되면 MVP 완료로 본다.

1. 실제 PortOne 운영 키로 결제가 열린다.
2. 결제 성공 후 서버에서 결제 금액/상태를 검증한다.
3. 검증 성공 시 구독 row가 `active`로 갱신된다.
4. 결제 이력 row가 누락 없이 저장된다.
5. 실패/취소/위변조 시 구독 상태가 갱신되지 않는다.

## 4. 파일별 최소 수정 포인트

### 4.1 `lib/portone.ts`

목표:

- 운영 환경변수 검증
- SDK 로드 실패 시 명확한 에러 처리
- 구독 결제에서도 식별 가능한 메타 전달 기반 확보

체크리스트:

- `VITE_PORTONE_STORE_ID` 확인
- `VITE_PORTONE_CHANNEL_KEY` 확인
- 운영 환경에서 PortOne SDK가 실제 로드되는지 확인
- `paymentId` 생성 규칙 통일
- 구독 결제 구분용 `orderName` 규칙 통일

권장 보완:

- 개인/시설 구독을 구분할 수 있도록 `paymentId` prefix 분리
- 검증용 식별자(`orderId` 또는 metadata 대체값) 설계

### 4.2 `components/SubscriptionPlans.tsx`

목표:

- 시설 월 구독 결제 성공 시 서버 검증 후 구독 반영
- 결제 실패/취소 시 상태 오염 방지

체크리스트:

- `requestPayment(...)` 호출 시 금액이 실제 플랜 금액과 일치하는지 확인
- `verifyPayment(...)` 성공 전에 `updateFacilitySubscription(...)` 호출하지 않기
- 검증 성공 후 `subscription_payments` row가 남는지 확인
- 취소 시 toast만 뜨고 DB 변경이 없는지 확인

권장 보완:

- `facilityId`, `plan.nameEn`, 결제 금액을 서버 검증 측에 함께 전달할 구조 추가
- 결제 검증 성공 후 저장되는 payment row에 `payment_id`, `amount`, `status` 확인

### 4.3 `components/PersonalSubscriptionPlans.tsx`

목표:

- 개인 월 구독도 시설과 동일한 검증 수준으로 맞추기

체크리스트:

- 결제 성공 후 `user_subscriptions` upsert 이전에 서버 검증 완료
- free 전환 시 기존 active 구독만 cancel 처리되는지 확인
- 개인 결제도 payment history 추적이 가능한지 확인

권장 보완:

- 개인 구독 전용 payment row 저장 방식 정의
- `expires_at` 30일 계산이 실제 운영 정책과 맞는지 확인

### 4.4 `supabase/functions/verify-payment/index.ts`

목표:

- 예약 결제뿐 아니라 구독 결제도 서버 기준으로 안전하게 검증

현재 상태:

- `orderId`가 있을 때 예약 소유권/금액 검증은 강하게 구현됨
- 구독 결제는 `orderId` 없이 호출되어 검증 강도가 상대적으로 약함

필수 보완:

- 구독 결제용 request body 스펙 추가
- 최소한 아래 값 중 일부를 서버에서 다시 검증
  - 구독 타입(개인/시설)
  - 대상 user/facility
  - 요청 플랜 id
  - 기대 금액

권장 방향:

- `kind: subscription`
- `targetType: personal | facility`
- `targetId`
- `planId`
- `expectedAmount`

서버는 이 값으로:

- 호출자 권한 확인
- 대상 구독 주체 확인
- 플랜 금액 재조회
- PortOne 금액 일치 검증

### 4.5 `lib/queries.ts`

목표:

- 구독 상태 변경과 결제 이력 적재를 실결제 흐름과 맞추기

확인 포인트:

- `updateFacilitySubscription(...)`가 결제 성공 이후에만 호출되는가
- `next_billing_date`가 월 정책에 맞게 계산되는가
- `subscription_payments` insert가 실제로 수행되는가
- `billing_period_start`, `billing_period_end`가 월 범위와 맞는가

필수 보완:

- 개인 구독에도 시설과 동급의 payment record 전략 적용 여부 결정
- payment row가 없는 성공 결제가 생기지 않도록 원자성 확보

## 5. 환경변수 / 운영 설정

필수:

- `VITE_PORTONE_STORE_ID`
- `VITE_PORTONE_CHANNEL_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `PORTONE_API_SECRET` (Edge Function)
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Function)

확인 항목:

- 운영 도메인이 PortOne 콘솔에 등록되어 있는가
- PortOne 콜백/리디렉션 정책이 현재 UX와 충돌하지 않는가
- Vercel production env에 키가 모두 반영됐는가

## 6. 최소 테스트 시나리오

### 6.1 시설 구독

1. Basic 플랜 결제 시작
2. PortOne 결제 완료
3. Edge Function 검증 성공
4. `facility_subscriptions` active 갱신
5. `subscription_payments` row 생성
6. 대시보드에서 다음 결제일 표시 확인

### 6.2 개인 구독

1. Basic 또는 Premium 결제 시작
2. PortOne 결제 완료
3. Edge Function 검증 성공
4. `user_subscriptions` active 갱신
5. payment history 저장 확인

### 6.3 실패 시나리오

- 결제 창 닫기
- 결제 실패
- 금액 불일치
- 서버 검증 실패

기대 결과:

- 구독 row 미갱신
- 결제 이력 미생성 또는 실패 상태 기록
- 사용자에게 명확한 오류 메시지 노출

## 7. 구현 순서

1. 운영 env 점검
2. 구독 결제용 서버 검증 payload 정의
3. `verify-payment`에 구독 검증 분기 추가
4. 시설 구독 저장 흐름 검증
5. 개인 구독 저장 흐름 검증
6. 테스트 결제 후 production 검증

## 8. 예상 작업량

현재 구조를 유지한 채 월 구독 실연동만 붙이는 범위라면:

- 코드 수정: 0.5~1.5일
- 테스트/검증: 0.5~1일
- 운영 env 및 실결제 점검: 0.5일

즉, 큰 구조 변경이 없다면 **약 1~3영업일** 범위로 보는 것이 현실적이다.

## 9. 결론

현재 구조는 이미 PortOne 연동 뼈대가 있으므로, “처음부터 결제 시스템 구축”은 아니다.  
하지만 **실운영에서 안전하게 쓰려면 PortOne 호출 자체보다 서버 검증과 payment record 일관성 보강이 더 중요하다.**

한 줄 요약:

`포트원 API만 붙이면 끝`은 아니고, `구독 결제 서버 검증 + 결제 이력 저장 + 상태 갱신 보장`까지 같이 마무리해야 MVP로 볼 수 있다.
