# PortOne NHN KCP Direction Memo

작성일: 2026-03-25  
최종 업데이트: 2026-03-25  
목적: Memorimap의 PortOne 연동 방향을 `NHN KCP 우선`으로 정리하고, 테스트 채널/일반결제/정기결제 구현 기준을 공식 문서 기준으로 고정한다.

## 1. 결정 요약

- 우선 PG 방향은 `NHN KCP`로 진행한다.
- 일반결제와 정기결제는 `채널 분리`를 기본 전제로 둔다.
- 현재 구현은 PortOne 채널 역할을 `general` / `billing`으로 분리한다.
- KG이니시스는 후보로 남겨두되, 현재 작업 기준은 KCP다.
- KCP 승인이 늦어질 경우 KG이니시스로 전환 가능. 코드는 PG 종속 없이 channelKey 교체만으로 대응할 수 있는 구조를 유지한다.

## 2. 공식 문서 확인 결과

확인 문서:

- PortOne NHN KCP v2 연동 가이드: https://developers.portone.io/opi/ko/integration/pg/v2/kcp-v2?v=v2
- PortOne v2 인증 결제: https://developers.portone.io/opi/ko/integration/start/v2/payment?v=v2
- PortOne v2 빌링키 발급: https://developers.portone.io/opi/ko/integration/start/v2/billing?v=v2
- PortOne v2 정기결제: https://developers.portone.io/opi/ko/integration/start/v2/subscription?v=v2

### 2.1 KCP 4가지 결제 흐름

| 흐름 | 호출 위치 | SDK 함수 / API | 용도 |
|------|---------|---------------|------|
| 결제창 일반결제 | 클라이언트 | `PortOne.requestPayment()` | 단건 결제, 예약금 |
| 결제창 빌링키 발급 | 클라이언트 | `PortOne.requestIssueBillingKey()` | 카드 등록 (결제 X) |
| API 빌링키 결제 | **서버** | `POST /payments/{id}/billing-key` | 정기결제 실행 |
| API 수기(키인) 결제 | 서버 | `POST /payments/{id}/instant` | 관리자 수동 결제 |

**핵심**: 정기결제는 2단계다.
1. 클라이언트에서 `requestIssueBillingKey()`로 빌링키 발급 (사용자가 카드 등록)
2. 서버에서 `POST /payments/{id}/billing-key`로 실제 결제 실행 (매월 자동)

### 2.2 channelKey 동작 원칙

- KCP는 **동일한 channelKey**로 일반결제와 빌링키 발급 모두 가능
- PortOne 콘솔에서 채널 1개만 만들어도 두 기능을 다 쓸 수 있음
- 현재 코드의 general/billing 분리는 **Memorimap 운영 편의를 위한 설계**이며, KCP 기술 제약이 아님
- 단일 PG(KCP)만 사용할 경우 같은 channelKey 값을 넣어도 무방

### 2.3 KCP 빌링키 제한사항

- 빌링키 발급은 **CARD만 지원** (계좌이체, 간편결제 등 불가)
- 빌링키 발급은 **KCP 사전 계약 필수** (일반결제와 별도 신청)
- API 빌링키 발급(비인증), 수기결제, 에스크로도 별도 사전 계약

### 2.4 KCP 전용 bypass 파라미터

| 파라미터 | 설명 | 필수 여부 |
|---------|------|---------|
| `bypass.kcp_v2.site_name` | 상호명 | 모바일 필수, PC 카드사 다이렉트 시 필수 |
| `bypass.kcp_v2.shop_user_id` | 부정거래 탐지용 회원 ID | 상품권/휴대폰 결제 시 필수 |
| `bypass.kcp_v2.site_logo` | 결제창 로고 URL (150x50 미만) | 선택 |
| `bypass.kcp_v2.skin_indx` | 결제창 색상 (1~12) | 선택 |
| `bypass.kcp_v2.kcp_pay_title` | 결제창 상단 문구 | 선택 |
| `bypass.kcp_v2.disp_tax_yn` | 현금영수증 노출 (Y/N/R/E) | 선택 |

### 2.5 customer 필수 필드 (KCP 기준)

| 상황 | fullName | phoneNumber | email |
|------|----------|-------------|-------|
| 일반결제 (SDK) | 필수 | 필수 | 필수 |
| 빌링키 발급 (SDK) | 필수 (모바일 카드사) | - | 필수 (PC 카드사) |
| 빌링키 결제 (서버 API) | 선택 | 선택 | 선택 |

**주의**: PortOne은 빈 문자열(`""`)을 거부 (`NON_EMPTY_STRING`). 값이 없으면 필드 자체를 생략.

### 2.6 paymentId 규칙

- 최대 40자
- 한글/특수문자 불가 → 영문 + 숫자 + `-` + `_`만 허용
- 중복 불가 (동일 paymentId 재사용 시 에러)
- 금액은 정수만 (소수점 불가)

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

## 5. 일반결제 구현 명세

### 5.1 SDK 호출 (클라이언트)

```typescript
// PortOne.requestPayment() — 단건 결제
const response = await PortOne.requestPayment({
    storeId: PORTONE_CONFIG.STORE_ID,
    channelKey: getChannelKey('general'),
    paymentId: `pay_${Date.now()}_${crypto.randomUUID().slice(0,8)}`,
    orderName: '[추모맵] 예약금',
    totalAmount: 50000,
    currency: 'KRW',
    payMethod: 'CARD',
    customer: {
        fullName: '홍길동',      // 필수
        phoneNumber: '01012345678', // 필수
        email: 'user@example.com',  // 필수
    },
    windowType: {
        pc: 'IFRAME',
        mobile: 'POPUP',
    },
    bypass: {
        kcp_v2: {
            site_name: '추모맵',  // 모바일 필수
        },
    },
});
```

### 5.2 결제 검증 (서버)

```
클라이언트 → verifyPayment(paymentId, expectedAmount)
  → Edge Function: GET /payments/{paymentId} (PortOne REST API)
  → 금액/상태 대조 → DB 저장
```

### 5.3 지원 결제수단

| payMethod | 설명 | KCP 지원 |
|-----------|------|---------|
| `CARD` | 신용/체크카드 | O |
| `TRANSFER` | 실시간 계좌이체 | O |
| `VIRTUAL_ACCOUNT` | 가상계좌 (회전식만) | O |
| `MOBILE` | 휴대폰 소액결제 | O |
| `EASY_PAY` | 간편결제 | O |
| `GIFT_CERTIFICATE` | 상품권 | O (shop_user_id 필수) |

### 5.4 Memorimap 일반결제 사용처

- 예약금 결제
- 단건 추가 서비스 결제
- 향후 리드 과금 등 1회성 결제

## 5B. 정기결제 구현 명세

### 5B.1 Step 1: 빌링키 발급 (클라이언트)

```typescript
// PortOne.requestIssueBillingKey() — 카드 등록만, 결제 X
const response = await PortOne.requestIssueBillingKey({
    storeId: PORTONE_CONFIG.STORE_ID,
    channelKey: getChannelKey('billing'),
    billingKeyMethod: 'CARD',  // KCP는 CARD만 지원
    issueId: `billing_${Date.now()}`,
    issueName: '[추모맵] 정기결제 카드 등록',
    customer: {
        fullName: '홍길동',        // 모바일 카드사 직접호출 시 필수
        email: 'user@example.com', // PC 카드사 직접호출 시 필수
    },
    offerPeriod: {
        interval: '1m',  // 월간 구독 주기 표시
    },
    windowType: {
        pc: 'IFRAME',
        mobile: 'POPUP',
    },
    bypass: {
        kcp_v2: {
            site_name: '추모맵',
        },
    },
});

// 응답에서 billingKey 추출 → DB 저장
const billingKey = response.billingKey;
```

**현재 코드 상태**: `requestIssueBillingKey` 미구현. `window.PortOne` 타입에도 없음.

### 5B.2 Step 2: 빌링키로 결제 실행 (서버)

```
Edge Function 또는 pg_cron → POST /payments/{paymentId}/billing-key
Authorization: PortOne {PORTONE_API_SECRET}

Body:
{
    "billingKey": "billing_key_xxx",
    "orderName": "[추모맵] 개인 프리미엄 월 구독",
    "amount": { "total": 4900 },
    "currency": "KRW"
}
```

**핵심**: 이 호출은 **서버에서만** 실행. 클라이언트에서 직접 호출 불가.

### 5B.3 Step 3: 자동 갱신 (서버)

매월 결제일에 서버가 빌링키로 결제를 실행하는 방식:

- **방법 A**: Supabase pg_cron → Edge Function 호출 → PortOne API
- **방법 B**: PortOne 예약결제 API (`POST /payments/{id}/schedule`)
- **방법 C**: 외부 스케줄러 (Vercel Cron 등)

### 5B.4 빌링키 관리

| 동작 | API | 비고 |
|------|-----|------|
| 발급 | `requestIssueBillingKey()` (SDK) | 사용자 카드 등록 |
| 결제 | `POST /payments/{id}/billing-key` | 서버에서 실행 |
| 삭제 | `DELETE /billing-keys/{billingKey}` | 해지 시 호출 |
| 조회 | `GET /billing-keys/{billingKey}` | 카드 정보 확인 |

**삭제 주의**: 예약결제건이 존재하면 `PaymentScheduleAlreadyExistsError` (409). 예약 취소 후 삭제해야 함.

### 5B.5 정기결제 에러 처리

| HTTP | 에러 | 설명 | 대응 |
|------|------|------|------|
| 400 | `InvalidRequestError` | 파라미터 오류 | 요청값 확인 |
| 404 | `BillingKeyNotFoundError` | 빌링키 없음 | 카드 재등록 안내 |
| 409 | `AlreadyPaidError` | 이미 결제됨 | 중복 요청 방지 |
| 409 | `BillingKeyAlreadyDeletedError` | 빌링키 삭제됨 | 카드 재등록 안내 |
| 502 | `PgProviderError` | PG사 오류 | 재시도 또는 수동 처리 |

### 5B.6 Memorimap 정기결제 사용처

| 대상 | 결제 주기 | 금액 |
|------|---------|------|
| 개인 프리미엄 | 월/연 | 4,900원/월 또는 58,800원/년 |
| 시설 라이트 | 월/연 | 49,000원/월 또는 588,000원/년 |
| 시설 프리미엄 | 월/연 | 199,000원/월 또는 2,388,000원/년 |
| 상조 파일럿 | 월 (3개월) | 150만원/월 |
| 상조 Growth | 월/연 | 300만원/월 또는 3,600만원/년 |
| 상조 Enterprise | 월/연 | 500만원/월 또는 6,000만원/년 |

### 5B.7 현재 코드 vs 필요 구현

| 항목 | 현재 | 필요 |
|------|------|------|
| `requestPayment` (일반결제) | `lib/portone.ts` 구현됨 | 유지 |
| `requestIssueBillingKey` (빌링키 발급) | **미구현** | 추가 필요 |
| `Window.PortOne` 타입에 `requestIssueBillingKey` | **없음** | 추가 필요 |
| 빌링키 DB 저장 | **없음** | `billing_keys` 테이블 또는 기존 테이블에 컬럼 추가 |
| 서버사이드 빌링키 결제 Edge Function | **없음** | 신규 생성 필요 |
| 빌링키 삭제 (해지) | **없음** | Edge Function 추가 |
| 자동 갱신 스케줄러 | **없음** | pg_cron 또는 PortOne 예약결제 |

### 5B.8 공통 파라미터 유의사항

- `paymentId`: 고유값, 최대 40자, 영문+숫자+`-`+`_`만
- `orderName`: 최대 100Byte
- `currency`: `KRW` (정수만, 소수점 불가)
- 빈 문자열 전송 금지 → 값 없으면 필드 자체 생략
- `customer.fullName`, `phoneNumber`, `email` — 일반결제는 3개 모두 필수

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

### 7.1 PG/채널 원칙
1. NHN KCP를 우선 기준으로 구현한다.
2. 일반결제와 정기결제를 채널 역할로 분리한다.
3. 구독 결제는 `billing` 채널을 사용한다.
4. PortOne 요청 파라미터는 PG 하드코딩 대신 채널 역할 중심으로 유지한다.
5. KCP 전용 bypass 파라미터는 필요한 범위만 최소 적용한다. `site_name`은 모바일 대응용으로 반드시 포함.

### 7.2 UI/화면 원칙
6. 일반결제 UI와 정기결제 UI는 같은 카드/버튼/문구를 재사용하지 말고 명확히 분리한다.
7. 정기결제 화면에는 `매월 자동 결제`, `다음 결제일부터 해지`, `당월 환불 없음` 핵심 문구를 표시한다.
8. 일반결제 화면에는 `1회 결제`, `정기 청구 없음` 문구를 명시한다.
9. 정기결제 화면에서는 약관 요약 블록 (자동갱신 동의, 해지 정책, 다음 결제일)을 결제 버튼 직전에 배치한다.

### 7.3 구현 순서
10. **Phase A (일반결제 먼저)**: `requestPayment` 기반 단건 결제를 먼저 정상화한다 (`prepare/v2 400` 해결 포함).
11. **Phase B (빌링키 발급)**: `requestIssueBillingKey` 함수 추가, `Window.PortOne` 타입 확장, 빌링키 DB 저장.
12. **Phase C (서버사이드 정기결제)**: Edge Function으로 `POST /payments/{id}/billing-key` 호출, 자동 갱신 스케줄러 구현.
13. **Phase D (해지/관리)**: 빌링키 삭제 API, 해지 플로우, 카드 변경 플로우.

### 7.4 상조 원칙
14. 상조는 본사만 과금 주체. 지사/대리점은 본사 하위 운영 계정.
15. 파일럿 최소 3개월 → 기본 전환안 Growth 300만원.

## 8. 다음 확인 항목

### 8.1 선행 블로커 (사용자 확인 필요)

| # | 항목 | 확인 위치 | 상태 |
|---|------|---------|------|
| 1 | PortOne 콘솔에서 `storeId`와 `channelKey`가 같은 스토어 소속인지 확인 | PortOne 관리자 콘솔 | 미확인 |
| 2 | 해당 채널이 활성 상태인지 확인 | PortOne 콘솔 > 채널 관리 | 미확인 |
| 3 | KCP 일반결제 계약 완료 여부 | PortOne 콘솔 또는 KCP 계약서 | 미확인 |
| 4 | KCP 빌링키 사전 계약 완료 여부 | KCP에 별도 신청 필요 | 미확인 |
| 5 | `PORTONE_API_SECRET` Supabase Edge Function secret 등록 | Supabase Dashboard > Secrets | 미확인 |
| 6 | `site_name` 최종 표기 확정 (`추모맵` / `(주)아톰케어`) | 사업자등록증 기준 | 미확인 |

### 8.2 `prepare/v2 400` 디버깅 (최우선)

- 브라우저 Network 탭에서 `prepare/v2` Response body 확인
- `customer.phoneNumber` 형식 문제 여부 (빈 문자열 전송 시 에러)
- `paymentId` 한글/특수문자 포함 여부 확인
- `channelKey`가 `storeId` 소속 채널인지 확인

### 8.3 Claude 구현 순서 (사용자 승인 후)

| Phase | 작업 | 선행 조건 |
|-------|------|---------|
| A-1 | `prepare/v2 400` 해결 + 일반결제 단건 테스트 성공 | 8.1 #1~#3 확인 |
| A-2 | 일반결제 화면 분리 (예약금 등) | A-1 |
| B-1 | `requestIssueBillingKey` 함수 + 타입 추가 | KCP 빌링키 계약 (#4) |
| B-2 | 빌링키 DB 저장 구조 (마이그레이션) | B-1 |
| B-3 | 정기결제 화면 (구독 플랜 선택 → 카드 등록) | B-2 |
| C-1 | 서버사이드 빌링키 결제 Edge Function | B-2 + #5 |
| C-2 | 자동 갱신 스케줄러 (pg_cron 또는 PortOne 예약결제) | C-1 |
| D-1 | 해지 플로우 + 빌링키 삭제 | C-1 |
| D-2 | 카드 변경 (재발급) 플로우 | D-1 |

## 9. 결제 화면 디자인 원칙

### 9.1 일반결제 화면

- 목적: 예약금, 단건 추가결제, 1회 구매
- 문구: `1회 결제`, `이번 한 번만 청구`, `정기 청구 없음`
- CTA 예시: `지금 결제`, `예약금 결제`
- 보조 문구: 환불/취소 기준, 주문 금액, 결제 수단

### 9.2 정기결제 화면

- 목적: 개인/시설/상조 월 구독
- 문구: `매월 자동 결제`, `최초 카드 등록 후 동일일 청구`, `해지 시 다음 결제일부터 중단`
- CTA 예시: `정기결제 시작`, `카드 등록 후 구독 시작`
- 보조 문구:
  - 청구 주기
  - 다음 결제일
  - 해지 정책
  - 당월 환불 없음

### 9.3 상조 본사형 정기결제 추가 문구

- 계약 주체는 `본사`만 허용
- 지사/대리점은 본사 하위 운영 계정으로만 사용
- 파일럿은 `월 150만원`, 최소 3개월
- 정식 전환 플랜:
  - `Growth 월 300만원`
  - `Enterprise 월 500만원`

### 9.4 디자인 구현 메모

- 일반결제와 정기결제는 색상 배지, 헤더 카피, 약관 요약 블록을 분리한다.
- 정기결제는 결제 버튼 직전 영역에 자동청구/해지 정책 요약 박스를 둔다.
- KCP 결제창 진입 전 화면에서 `billing` 여부가 사용자가 바로 식별되도록 한다.

## 10. 한 줄 결론

Memorimap의 PortOne 연동은 `NHN KCP 우선 + general/billing 채널 분리` 기준으로 가는 것이 맞다.

### 🟢 2026-03-26 정정

- **windowType은 KCP V2에서 미지원** — 코드에서 완전 제거됨. 이 문서의 windowType 예시는 무효.
- **prepare/v2 400 해결** — 원인은 V1 채널키로 V2 SDK 호출. V2 채널 신규 생성 후 해결.
- **bypass도 제거** — 최소 요청으로 정상 동작 확인. 필요 시 `kcp_v2.site_name`만 재추가.
- **DB 영속화는 EF service_role 경유** — 프론트 직접 DB 쓰기는 제거됨.

## 11. 2026-03-25 테스트 보정 메모

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

### 10.4 facility 결제 정책 주의

- 현재 facility / sangjo 결제 저장은 auth client 경로를 사용한다.
- 따라서 PortOne 채널과 별개로 `subscription_payments` INSERT RLS 정책이 함께 맞아야 한다.
- 구정책 `payments_insert_service_or_owner`를 제거하기 전에는 facility 결제이력 insert가 새 정책만으로 통과하는지 먼저 확인해야 한다.
