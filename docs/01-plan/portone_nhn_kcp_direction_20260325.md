# PortOne NHN KCP Direction Memo

작성일: 2026-03-25  
최종 업데이트: 2026-03-25  
목적: Memorimap의 PortOne 연동 방향을 `NHN KCP 우선`으로 정리하고, 테스트 채널/일반결제/정기결제 구현 기준을 공식 문서 기준으로 고정한다.

## 1. 결정 요약

- 우선 PG 방향은 `NHN KCP`로 진행한다.
- 일반결제와 정기결제는 `채널 분리`를 기본 전제로 둔다.
- 현재 구현은 PortOne 채널 역할을 `general` / `billing`으로 분리한다.
- KG이니시스는 후보로 남겨두되, 현재 작업 기준은 KCP다.

## 2. 공식 문서 확인 결과

확인 문서:

- PortOne NHN KCP v2 연동 문서  
  https://developers.portone.io/opi/ko/integration/pg/v2/kcp-v2?v=v2

핵심 확인 사항:

1. KCP는 PortOne `channelKey`로 채널을 지정해 결제 요청한다.
- SDK 결제 요청 시 `storeId`, `channelKey`, `paymentId`, `orderName`, `totalAmount`, `currency`, `payMethod`가 기본 축이다.

2. 일반결제와 빌링키 결제는 문서에서 별도 흐름으로 구분되어 있다.
- 결제창 일반 결제
- 결제창 빌링키 발급
- API 수기(키인) 결제
- API 빌링키 발급

3. 빌링키/정기결제는 KCP 사전 계약 항목이다.
- API를 통한 빌링키 발급은 KCP 사전 신청/계약이 완료되어야 한다.

4. KCP 전용 bypass 파라미터가 있다.
- `bypass.kcp_v2.site_logo`
- `bypass.kcp_v2.skin_indx`
- `bypass.kcp_v2.kcp_pay_title`
- `bypass.kcp_v2.shop_user_id`
- `bypass.kcp_v2.site_name`

5. `site_name`은 중요하다.
- PC 일부 카드사 다이렉트 호출 시 필수
- 모바일에서는 필수

## 3. Memorimap 적용 해석

Memorimap 기준으로는 이렇게 해석하는 것이 맞다.

- `general` 채널:
  - 일반결제
  - 단건 결제
  - 예약금/추가 결제 등

- `billing` 채널:
  - 개인 구독
  - 시설 구독
  - 빌링키 기반 정기결제

즉, 현재 코드에서:

- 일반결제는 `getChannelKey('general')`
- 구독 결제는 `getChannelKey('billing')`

구조로 두는 것이 KCP 방향과 맞다.

## 4. 테스트 채널 운영 원칙

KCP 테스트는 채널을 2개로 나누는 쪽이 안전하다.

권장 채널:

- `kcp_general_test`
- `kcp_billing_test`

권장 환경변수:

- `VITE_PORTONE_STORE_ID`
- `VITE_PORTONE_CHANNEL_KEY`
- `VITE_PORTONE_BILLING_CHANNEL_KEY`

현재 코드 원칙:

- `VITE_PORTONE_CHANNEL_KEY`: 일반결제용
- `VITE_PORTONE_BILLING_CHANNEL_KEY`: 정기결제용
- `billing`이 비어 있으면 `general`을 fallback으로 사용

## 5. SDK 요청 시 체크 포인트

### 5.1 일반결제

- `PortOne.requestPayment(...)`
- `channelKey`: general 채널
- `payMethod`: `CARD`, `TRANSFER`, `VIRTUAL_ACCOUNT`, `MOBILE`, `EASY_PAY` 등

### 5.2 빌링키/정기결제

- 빌링키 발급 및 정기결제는 KCP 사전 계약 완료 후 사용
- `channelKey`: billing 채널
- 일반결제와 혼용하지 말고 역할을 분리해서 관리

### 5.3 공통 파라미터 유의사항

- `paymentId`: 고유값, KCP는 최대 40자
- `orderName`: KCP는 최대 100Byte
- `currency`: 원화면 `KRW`
- `customer.fullName`
- `customer.phoneNumber`
- `customer.email`

## 6. KCP 전용 bypass 권장안

결제창 호출 시 아래 파라미터 검토 권장:

- `bypass.kcp_v2.site_name`
  - 모바일 필수 대응
  - 카드사 다이렉트 호출 대응
- `bypass.kcp_v2.shop_user_id`
  - 리스크 관리용 회원 ID
- `bypass.kcp_v2.site_logo`
  - 결제창 브랜딩

Memorimap 적용 권장:

- `site_name`: `(주)아톰케어` 또는 서비스 표기명 검토
- `shop_user_id`: Clerk 사용자 ID 또는 내부 사용자 ID

## 7. Claude 작업 기준

Claude는 아래 기준으로 구현을 이어간다.

1. NHN KCP를 우선 기준으로 구현한다.
2. 일반결제와 정기결제를 채널 역할로 분리한다.
3. 구독 결제는 `billing` 채널을 사용한다.
4. PortOne 요청 파라미터는 PG 하드코딩 대신 채널 역할 중심으로 유지한다.
5. KCP 전용 bypass 파라미터는 필요한 범위만 최소 적용한다.

## 8. 다음 확인 항목

- PortOne 콘솔에서 KCP 일반결제 테스트 채널 생성
- PortOne 콘솔에서 KCP 정기결제 테스트 채널 생성
- 운영 KCP 계약 범위에 빌링키 포함 여부 확인
- `site_name` 최종 표기 확정
- 실기기에서 일반결제 / 정기결제 각각 테스트

## 9. 한 줄 결론

Memorimap의 PortOne 연동은 `NHN KCP 우선 + general/billing 채널 분리` 기준으로 가는 것이 맞다.

## 10. 2026-03-25 테스트 보정 메모

### 10.1 billing fallback 해석

- 현재 코드에서 `VITE_PORTONE_BILLING_CHANNEL_KEY`가 비어 있으면 `VITE_PORTONE_CHANNEL_KEY`로 fallback 한다.
- 이 fallback은 현재 구독 상품 결제 테스트를 진행할 수 있게 해주지만, KCP의 빌링키 기반 자동 정기결제까지 대체한다는 의미는 아니다.
- 즉 현재 상태는 `구독 상품의 1회 결제 + 앱 내부 구독 상태 저장` 검증에는 사용할 수 있으나, 추후 자동 청구를 붙일 경우 billing 전용 채널과 KCP 계약 범위를 별도로 확인해야 한다.

### 10.2 상조 plan_id 저장값

- 상조 결제 검증 시 `verify-payment`에는 `SJ_STARTER`를 넘긴다.
- 실제 `facility_subscriptions.plan_id` 저장값은 `normalizeSubscriptionPlanId()`를 거쳐 `sj_starter`로 저장된다.
- 운영 검증 문서와 SQL 확인 예시는 저장값 기준으로 `sj_starter`를 사용한다.

### 10.3 PORTONE_API_SECRET 확인 위치

- 프론트 `.env.local` 또는 Vercel보다 우선 확인해야 하는 곳은 Supabase Edge Function secret이다.
- `verify-payment`는 Supabase Edge Function에서 PortOne API를 호출하므로, `PORTONE_API_SECRET`가 Supabase 환경에 없으면 결제 검증이 실패한다.
- 따라서 운영 체크리스트에서는 `Supabase Dashboard -> Edge Functions -> Secrets` 확인을 최우선으로 둔다.
