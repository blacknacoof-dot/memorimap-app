# 빌링키 정기결제 구현 계획

작성일: 2026-03-25
목적: 현재 1회 결제 방식을 PortOne 빌링키 기반 자동 정기결제로 전환하기 위한 구현 계획서

## 1. 현재 상태

### 현재 결제 구조 (1회 결제 + 앱 내부 구독 관리)

```
사용자 "구독" 클릭
→ PortOne.requestPayment() (일시결제)
→ verify-payment Edge Function (금액/상태 검증)
→ DB 구독 상태 저장 (user_subscriptions / facility_subscriptions)
→ DB 결제이력 저장 (subscription_payments)
→ 끝 (다음 달 자동 결제 없음)
```

### 문제

- 매월 사용자가 직접 결제해야 함
- 구독 만료 시 자동 갱신 없음
- 결제 실패 시 재시도 로직 없음
- 실질적으로 "구독"이 아닌 "월 단위 1회 구매"

## 2. 목표 구조 (빌링키 정기결제)

```
최초 구독 시:
  사용자 "구독" 클릭
  → PortOne.requestIssueBillingKey() (빌링키 발급)
  → 빌링키 DB 저장
  → 첫 결제 실행 (서버사이드 API)
  → 구독 상태 + 결제이력 저장

매월 자동 갱신:
  Cron Edge Function (매일 실행)
  → next_billing_date 도래한 구독 조회
  → 빌링키로 자동 결제 (PortOne API)
  → 성공: 구독 갱신 + 결제이력 저장
  → 실패: 재시도 (3일간 3회) → 최종 실패 시 구독 일시중지 또는 만료
```

운영 기본 정책:

- 월 정기결제는 `최초 카드 등록 후 매월 동일일 자동 청구`
- 해지 신청 시 `다음 결제일부터 중단`
- 이미 결제된 당월 이용기간은 유지
- 이미 결제된 당월 결제분은 원칙적으로 환불하지 않음
- 상조 파일럿은 `최소 3개월`을 기본 전제로 보고, 중도 해지 환불은 원칙적으로 제공하지 않음

## 3. 구현 범위

### 3.1 프론트엔드

#### 변경 대상 파일

- `lib/portone.ts`: `requestIssueBillingKey()` 함수 추가
- `components/PersonalSubscriptionPlans.tsx`: 결제 흐름을 빌링키 발급으로 변경
- `components/SubscriptionPlans.tsx`: 시설/상조 결제 흐름을 빌링키 발급으로 변경

#### 빌링키 발급 호출 예시 (PortOne v2 SDK)

```typescript
const response = await PortOne.requestIssueBillingKey({
    storeId: PORTONE_CONFIG.STORE_ID,
    channelKey: getChannelKey('billing'),
    billingKeyMethod: 'CARD',
    customer: {
        fullName: '...',
        phoneNumber: '...',
        email: '...',
    },
});
// response.billingKey → 서버로 전송
```

#### 주의사항

- `requestPayment()`와 `requestIssueBillingKey()`는 다른 함수
- 빌링키 발급 시에는 실제 결제가 발생하지 않음 (카드 등록만)
- 첫 결제는 서버사이드에서 빌링키로 별도 실행해야 함

### 3.2 Edge Function (신규)

#### `charge-subscription` (매월 자동 청구)

```
역할: next_billing_date 도래한 구독을 자동 결제
트리거: Cron (매일 00:00 또는 매시간)
로직:
  1. next_billing_date <= now() AND status = 'active' 조회
  2. 각 구독의 billing_key로 PortOne API 결제 요청
  3. 성공 → next_billing_date 갱신, subscription_payments insert
  4. 실패 → retry_count 증가, 3회 초과 시 status = 'past_due' 또는 'expired'
```

#### `issue-billing-key` (빌링키 저장)

```
역할: 프론트에서 발급받은 빌링키를 검증 후 DB 저장
입력: billingKey, userId/facilityId, planId
로직:
  1. JWT 인증
  2. billingKey 유효성 확인 (PortOne API)
  3. DB 저장
  4. 첫 결제 실행
```

#### `cancel-subscription` (해지 예약)

```text
역할: 사용자 해지 요청을 받아 자동결제를 다음 청구일부터 중단
입력: subscriptionId 또는 userId/facilityId
로직:
  1. JWT 인증
  2. 본인/소유권 검증
  3. status='cancel_scheduled', cancel_at_period_end=true 저장
  4. UI에는 "다음 결제일부터 해지" 상태 노출
```

### 3.3 DB 스키마 변경

#### 신규 컬럼 (facility_subscriptions / user_subscriptions 공통)

```sql
ALTER TABLE facility_subscriptions
  ADD COLUMN IF NOT EXISTS billing_key TEXT,
  ADD COLUMN IF NOT EXISTS billing_key_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_error TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS billing_key TEXT,
  ADD COLUMN IF NOT EXISTS billing_key_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_error TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;
```

#### 보안 주의

- `billing_key`는 민감 정보 → RLS에서 본인/service_role만 접근 가능하도록 제한
- SELECT 정책에서 billing_key 컬럼은 소유자만 조회 가능
- 프론트에서 billing_key 직접 노출 금지

### 3.4 PortOne API (서버사이드 결제)

빌링키로 결제 실행 (Edge Function에서 호출):

```
POST https://api.portone.io/v2/payments/{paymentId}/billing-key
Headers:
  Authorization: PortOne {PORTONE_API_SECRET}
Body:
  billingKey: "..."
  orderName: "[추모맵] 개인 프리미엄 플랜 (자동갱신)"
  amount: { total: 4900, currency: "KRW" }
  customer: { ... }
```

### 3.5 Cron 설정

Supabase Edge Function cron 설정 (pg_cron 또는 외부 cron):

```sql
-- 매일 자정 실행
SELECT cron.schedule(
  'charge-subscriptions',
  '0 0 * * *',
  $$SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/charge-subscription',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  )$$
);
```

## 4. 전환 시나리오

### 4.1 신규 가입자

- 빌링키 발급 → 첫 결제 → 매월 자동 갱신

### 4.2 기존 가입자 (1회 결제로 활성 상태)

- 다음 갱신 시점에 빌링키 등록 안내
- 빌링키 미등록 시 만료 처리 (기존 기간은 유지)
- 강제 전환 금지

### 4.3 상조 파일럿

- 상조 유료 계약은 `본사`만 받는다.
- `지사/대리점`은 본사 하위 운영 계정으로만 처리한다.
- 파일럿 3개월은 빌링키 자동 갱신 또는 월 수동 청구 중 하나로 운영 가능하되, 계약 문구를 먼저 확정한다.
- 3회 결제 완료 후 기본 전환안은 `Growth 300만원/월`
- 대형 본사형 계약은 `Enterprise 500만원/월`
- 자동 전환은 미구현 → 사전 안내 후 수동 협의로 plan 변경

## 5. 결제 3종 흐름 변경

### 개인 프리미엄 (4,900원/월)

```
현재: requestPayment(4900) → verify → DB 저장
변경: requestIssueBillingKey() → issue-billing-key EF → 첫 결제 → DB 저장
갱신: charge-subscription cron → 매월 4900 자동 청구
```

### 개인 시그니처 (9,900원/월)

```
현재: 미구현
변경: requestIssueBillingKey() → issue-billing-key EF → 첫 결제 → DB 저장
갱신: charge-subscription cron → 매월 9900 자동 청구
```

### 시설 라이트/프리미엄 (49,000 / 199,000원/월)

```
현재: requestPayment(금액) → verify → DB 저장
변경: requestIssueBillingKey() → issue-billing-key EF → 첫 결제 → DB 저장
갱신: charge-subscription cron → 매월 자동 청구
```

### 시설 엔터프라이즈 (문의형)

```text
현재: self-serve 결제 없음
변경: 영업/관리자 수동 승인 후 청구 또는 별도 계약형 결제
원칙: 가격표 노출은 가능하지만 즉시 결제 버튼은 제공하지 않음
```

### 상조 본사 플랜

#### 파일럿 (1,500,000원/월 × 3개월)

```
현재: requestPayment(1500000) → verify → DB 저장
변경: requestIssueBillingKey() → issue-billing-key EF → 첫 결제 → DB 저장
갱신: charge-subscription cron → 매월 자동 청구 (3회 제한)
```

#### Growth (3,000,000원/월)

```text
현재: 미구현
변경: 본사 계약 전환 후 billing 채널로 월 자동 청구
해지: 다음 결제일부터 중단, 당월 환불 없음
```

#### Enterprise (5,000,000원/월)

```text
현재: 미구현
변경: 본사 맞춤 계약 + billing 채널 월 자동 청구
비고: 하위 조직 계정/전담 운영 옵션 포함 가능
```

## 6. 선행 조건 (구현 전 확인)

| 항목 | 확인 위치 | 상태 |
|------|-----------|------|
| KCP 빌링키 계약 포함 여부 | PortOne 콘솔 / KCP 계약서 | 미확인 |
| PortOne v2 SDK `requestIssueBillingKey` 지원 | PortOne 문서 | 문서 확인 완료 |
| Supabase pg_cron 또는 외부 cron 사용 가능 여부 | Supabase 플랜 | 미확인 |
| billing_key 암호화 저장 필요 여부 | 보안 정책 | 미확인 |

## 7. 구현 순서

```
Phase 1: 스키마 + 타입
  - billing_key 등 컬럼 추가 마이그레이션
  - types/db.ts 업데이트
  - RLS 정책 (billing_key 접근 제한)

Phase 2: Edge Function
  - issue-billing-key (빌링키 저장 + 첫 결제)
  - charge-subscription (자동 갱신)
  - cancel-subscription (다음 결제일부터 해지 예약)

Phase 3: 프론트엔드
  - lib/portone.ts에 requestIssueBillingKey 추가
  - PersonalSubscriptionPlans.tsx 빌링키 흐름으로 변경
  - SubscriptionPlans.tsx 빌링키 흐름으로 변경
  - 일반결제 / 정기결제 UI 분리
  - 해지 예약 UI 추가

Phase 4: Cron 설정 + 테스트
  - pg_cron 또는 외부 cron 설정
  - 테스트 결제 (빌링키 발급 → 첫 결제 → 자동 갱신)
  - 실패 재시도 테스트
  - 구독 만료 테스트
  - 해지 예약 후 다음 청구 중단 테스트

Phase 5: 기존 가입자 전환
  - 빌링키 미등록 안내 UI
  - 갱신 시점 전환 로직
```

## 8. 의사결정 필요 항목

1. KCP 빌링키 계약이 현재 포함되어 있는지 (미포함이면 추가 신청 필요)
2. 출시 시점에 빌링키까지 갈 것인지, 1회 결제 + 수동 갱신으로 먼저 출시할 것인지
3. 결제 실패 시 재시도 횟수/간격 정책 (권장: 3일간 3회)
4. 상조 파일럿 3회 결제 후 `Growth 300만원` 전환을 기본값으로 둘지 여부

## 9. Claude 작업 기준

Claude는 아래 기준으로 구현을 이어간다.

1. 상조 유료 플랜은 `본사 계약형`만 지원한다.
2. 지사/대리점은 독립 과금 대상이 아니라 본사 하위 운영 계정으로 본다.
3. 월 정기결제 해지는 `다음 결제일부터 중단`으로 처리한다.
4. 파일럿 3개월 중도 해지는 원칙적으로 환불하지 않는 정책을 UI/약관에 반영한다.
5. Growth `300만원`, Enterprise `500만원`은 본사 전환 플랜으로 문서와 코드 상수에 반영한다.
6. 일반결제와 정기결제는 UI, 용어, 버튼 라벨을 분리한다.

## 10. 참고 문서

- PortOne NHN KCP v2 연동: https://developers.portone.io/opi/ko/integration/pg/v2/kcp-v2?v=v2
- `docs/01-plan/claude_pricing_execution_handoff_20260325.md`
- `docs/01-plan/portone_nhn_kcp_direction_20260325.md`
- `docs/01-plan/features/subscription_pricing_migration.plan.md`
- `docs/04-report/work_log_20260325_pricing_v1.md`
