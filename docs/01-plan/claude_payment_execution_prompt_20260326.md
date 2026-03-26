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
