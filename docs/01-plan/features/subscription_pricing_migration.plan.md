# Subscription Pricing Migration Plan

작성일: 2026-03-24
최종 업데이트: 2026-03-25
목적: Memorimap 요금제 개편을 `실결제 안정화`와 `가격 구조 개편`으로 분리하고, 현재 코드 기준으로 안전한 이행 순서를 정리한다.

## 1. Goal

이번 작업의 목표는 아래 3가지를 동시에 만족하는 것이다.

1. 개인/시설 요금제에 `월간 | 연간` 결제 주기를 도입할 수 있는 구조를 만든다.
2. 상조 상품은 기존 `SJ_*` canonical id를 유지하면서도, 외부 노출은 계약형 CTA 중심으로 전환할 수 있게 만든다.
3. 기존 가입자는 강제 전환 없이 유지하고, 신규 정책은 점진적으로 적용한다.

## 2. Non-goals

이번 단계에서 바로 하지 않는 것:

- 기존 `plan_id` 체계를 전면 폐기
- 기존 가입자의 가격 강제 변경
- 상조 운영 플로우 전체를 별도 CRM으로 분리
- PG 교체 자체를 개편 범위에 포함

## 3. Current State

현재 코드/문서 기준 핵심 상태:

- 개인 플랜
  - `PERSONAL_FREE`
  - `PERSONAL_BASIC`
  - `PERSONAL_PREMIUM`
- 시설 플랜
  - `FREE`
  - `BASIC`
  - `PREMIUM`
  - `ENTERPRISE`
- 상조 플랜
  - `SJ_STARTER`
  - `SJ_PROFESSIONAL`
  - `SJ_ENTERPRISE`

현재 구조의 문제:

- `plan_id`와 사용자 노출명이 분리되어 있지 않다.
- 결제 주기 개념(`billing_cycle`)이 없다.
- 다음 청구일 계산이 월간 기준에 고정되어 있다.
- 상조 상품을 일반 구독처럼 다루고 있어 계약형 전환이 어렵다.

## 4. Core Principles

- `plan_id`는 내부 canonical id로 유지한다.
- 사용자에게 보여주는 이름은 `display_plan_name`으로 분리한다.
- 결제 주기는 `billing_cycle`로 별도 관리한다.
- 기존 가입자는 기본적으로 `monthly`로 안전하게 백필한다.
- 상조는 내부 id는 유지하고, 외부 UX만 계약형 CTA로 분리한다.

## 5. Functional Requirements

### 5.1 공통

- 결제 완료 후 구독 row에 `billing_cycle`이 저장되어야 한다.
- 다음 청구일 계산은 `billing_cycle` 기준으로 달라져야 한다.
- 결제 이력 row에도 주기/할인/최종금액 정보가 남아야 한다.

### 5.2 개인/시설

- 요금제 UI에 `monthly | annual` 토글을 추가할 수 있어야 한다.
- 할인 금액 또는 할인율을 화면과 결제 이력에서 추적할 수 있어야 한다.
- 기존 가입자는 별도 opt-in 없이 자동 annual 전환되지 않아야 한다.

### 5.3 상조

- `SJ_*` id는 정산/내부 참조용으로 유지한다.
- 외부 노출은 `Pilot`, `Growth`, `Performance`, `Enterprise` 같은 계약형 명칭으로 바꿀 수 있어야 한다.
- 상조는 일반 자동갱신보다 `manual | sales_renewal | contract` 성격을 우선 지원해야 한다.

## 6. Proposed Schema

### 6.1 Subscription tables

시설/개인 구독 테이블에 공통적으로 검토할 필드:

- `billing_cycle text not null default 'monthly'`
- `contract_start_at timestamptz null`
- `contract_end_at timestamptz null`
- `renewal_type text not null default 'auto'`
- `discount_amount numeric null default 0`
- `discount_reason text null`
- `display_plan_name text null`

권장 값:

- `billing_cycle`: `monthly | annual | pilot | contract`
- `renewal_type`: `auto | manual | sales_renewal`

### 6.2 Sangjo-specific fields

상조 계약형 운영 확장 시 검토할 필드:

- `committed_leads integer null`
- `service_credits integer null`
- `commission_rate numeric null`
- `exclusive_region text[] null`
- `onboarding_fee_waived boolean not null default false`

### 6.3 Payment history fields

`subscription_payments` 또는 개인 결제 이력 테이블에 포함되어야 할 값:

- `billing_cycle`
- `list_price`
- `discount_amount`
- `final_amount`
- `discount_reason`

이유:

- 할인 적용 근거 추적
- MRR/ARR 분석
- 환불/정산 기준 확보

## 7. Canonical ID Rules

### 7.1 Facility

- `FREE`
- `BASIC`
- `PREMIUM`
- `ENTERPRISE`

주기 예시:

- `BASIC` + `billing_cycle=monthly`
- `BASIC` + `billing_cycle=annual`
- `PREMIUM` + `billing_cycle=monthly`
- `PREMIUM` + `billing_cycle=annual`

### 7.2 Personal

- `PERSONAL_FREE`
- `PERSONAL_BASIC`
- `PERSONAL_PREMIUM`

중요:

- 현재 코드에는 `personal_free`, `personal_basic`, `personal_premium` 같은 소문자 id 저장 경로가 남아 있다.
- 마이그레이션 전, 개인 구독의 canonical `plan_id`를 `PERSONAL_*`로 통일할지 먼저 확정해야 한다.

### 7.3 Sangjo

- 내부 저장: `SJ_STARTER`, `SJ_PROFESSIONAL`, `SJ_ENTERPRISE`
- 외부 표기: `display_plan_name = Pilot | Growth | Performance | Enterprise`
- 계약 성격: `billing_cycle = pilot | contract`

## 8. Migration Phases

### Phase 1: Schema expansion

- 신규 컬럼 추가
- 모든 기존 row를 `billing_cycle = monthly`로 백필
- 기존 코드 경로를 깨지 않고 읽기 호환성 확보

완료 조건:

- 기존 플랜/권한/결제가 추가 장애 없이 동작

### Phase 2: Read path support

- 프론트/서버에서 `billing_cycle`, `display_plan_name` 읽기 지원
- 다음 청구일 계산 로직 분기
- 관리자 화면에 billing cycle 노출

완료 조건:

- 기존 사용자와 신규 사용자 모두 정상 조회 가능

### Phase 3: Write path support

- 개인/시설 결제 UI에 월간/연간 토글 추가
- 할인 정보 결제 이력 저장
- 상조는 일반 결제 대신 계약 문의/CTA 분리 시작

완료 조건:

- 신규 annual 구독 생성 가능
- 결제 이력에 할인/주기 정보 저장

### Phase 4: Operational rollout

- 상조 노출 플랜명 변경
- 계약형 안내/문의 플로우 반영
- 기존 상조 고객은 갱신 시점에만 신규 구조 적용

완료 조건:

- 기존 계약 고객 운영 리스크 없이 전환

## 9. Existing Subscriber Policy

### 9.1 Personal / Facility

- 기존 유료 가입자는 그대로 유지
- 자동 annual 전환 금지
- 갱신 시점 이전까지 가격/권한 유지
- annual 전환은 사용자가 직접 선택한 경우에만 허용

### 9.2 Sangjo

- 기존 고객은 현재 계약/과금 체계 유지
- 신규 제안서/UI는 계약형 문의 중심으로 전환
- 재계약 또는 영업 갱신 시점에만 신규 구조 적용

## 10. Current Code Verification

2026-03-25 기준 코드 검증 결과:

### 10.1 일치하는 내용

- `lib/portone.ts` 존재
- `verify-payment` Edge Function 존재
- `SubscriptionPlans.tsx` / `PersonalSubscriptionPlans.tsx` 존재
- DB에는 아직 `billing_cycle` 관련 필드가 없다

### 10.2 중요한 실제 차이

#### ISSUE-1: 시설과 개인의 결제 이력 처리 경로가 다름

- 시설 결제는 `SubscriptionPlans.tsx`에서 검증 후 `updateFacilitySubscription()` 호출
- 이 함수는 `facility_subscriptions` upsert 후 `subscription_payments` insert를 수행한다
- 따라서 문서상 “결제 이력 insert 미확인”으로 쓰면 부정확하다

관련 코드:

- [SubscriptionPlans.tsx](/C:/Users/black/Desktop/memorimap/components/SubscriptionPlans.tsx#L304)
- [lib/queries.ts](/C:/Users/black/Desktop/memorimap/lib/queries.ts#L1483)

#### ISSUE-2: 개인 구독의 canonical `plan_id`가 아직 불안정함

- 개인 결제 후 `user_subscriptions` upsert는 현재 `plan.id`를 저장한다
- 즉 `personal_basic`처럼 소문자 id 저장 경로가 남아 있다
- 문서의 `PERSONAL_* canonical` 전략과 실제 코드가 아직 완전히 맞지 않는다

관련 코드:

- [PersonalSubscriptionPlans.tsx](/C:/Users/black/Desktop/memorimap/components/PersonalSubscriptionPlans.tsx#L238)

#### ISSUE-3: 개인 결제 이력 저장 전략이 문서에 명시되지 않음

- 시설은 `subscription_payments` 이력이 있다
- 개인은 현재 코드상 별도 결제 이력 insert가 바로 보이지 않는다
- Track B 전에 개인도 동일 테이블을 쓸지, 별도 테이블을 둘지 결정 필요

## 11. Execution Tracks

### Track A: PortOne live integration first

목표:

- 현재 월 구독 구조를 유지한 채 실결제를 먼저 운영 가능 상태로 만든다.
- 요금제 개편과 결제 안정화 리스크를 분리한다.

작업 범위:

- PortOne 가맹점 신청/승인
- `verify-payment` 검증 보강
- 시설/개인 결제 흐름 보완
- 운영 환경변수 입력
- 테스트 결제 검증

담당 제안:

- 사용자
  - PortOne 신청/PG 승인 대응
  - 운영 키 입력
  - 실결제 최종 승인 테스트
- Claude
  - `verify-payment` 보강
  - 결제 공통 흐름 정리
  - `SubscriptionPlans.tsx` / `PersonalSubscriptionPlans.tsx` 반영
  - 테스트 결제 검증 및 결과 문서화
- GPT
  - 신청 체크리스트/운영 문서 정리
  - 이행 기준 문서 정리

완료 조건:

- 운영 환경에서 월 구독 결제가 정상 동작
- 결제 성공 후 구독 상태 반영
- 결제 이력 저장 확인
- PC/모바일 결제 흐름 모두 검증

### Track B: Pricing migration after A stabilization

목표:

- 월/연간 토글, 할인, 상조 계약형 CTA 분리, 기존 가입자 백필을 단계적으로 반영한다.

작업 범위:

- `billing_cycle` 등 스키마 확장
- 타입/쿼리 반영
- 월/연간 UI 및 할인 배지
- 상조 계약형 CTA 분리
- 기존 가입자 백필 및 검증

담당 제안:

- GPT
  - 스키마 초안 및 정책 문서 정리
  - 프론트 UI 구조안
  - 상조 계약형 CTA 설계
- Claude
  - 타입/쿼리 반영
  - 실제 프론트 UI 반영
  - 백필 및 데이터 검증
  - 기존 가입자 안전성 검토
- 사용자
  - 할인 정책/운영 정책 확정
  - 상조 계약형 운영 여부 확정

완료 조건:

- 월간/연간 표시와 결제 데이터 구조 일치
- 기존 가입자 `monthly` 백필 완료
- 상조가 일반 구독과 분리된 CTA/운영 플로우 확보

## 12. Recommended Sequence

1. PortOne 신청
2. Track A 실결제 MVP 연결
3. 운영 검증 및 오류 수습
4. 최소 스키마 확정
5. Track B 가격 구조 개편 착수

현재 권장 원칙:

- 결제 안정화가 가격 개편보다 우선이다.
- 가격 개편은 스키마와 canonical id 규칙부터 확정한다.
- 상조 계약형 CTA 분리는 Track B에서 별도 설계로 다룬다.
- GPT는 설계/정책 문서를 우선하고, Claude는 실제 코드 반영과 데이터 검증을 맡는다.

## 13. Pre-implementation Checklist

- `subscription_plans` 테이블 존재 및 데이터 확인
- `subscription_payments` 컬럼 구조 확인
- `facility_subscriptions` / `user_subscriptions` row 구조 확인
- 개인 canonical `plan_id` 규칙 확정
- 개인 결제 이력 저장 정책 확정
- `VITE_PORTONE_STORE_ID`, `VITE_PORTONE_CHANNEL_KEY`, `PORTONE_API_SECRET` 확인

## 14. Success Metrics

### Personal

- annual 선택률 15% 이상
- 90일 기준 ARR 상승
- 무료 전환율 과도 증가 방지

### Facility

- annual 선택률 10% 이상
- Premium 이상 비중 유지 또는 상승
- 90일 유지율 개선

### Sangjo

- 계약형 CTA 전환 후 문의율 유지 또는 상승
- 평균 계약 금액 유지 또는 상승
- 무료/저가 진입으로 브랜드 가치가 과도하게 하락하지 않을 것

## 15. Open Questions

- 개인 annual 할인율은 15% 고정인지, 20%까지 허용할지
- 시설 Enterprise를 self-serve annual로 둘지, 별도 문의형으로 둘지
- 상조 `Pilot`을 실제 결제 가능한 플랜으로 둘지, 문의 전용으로 둘지
- grandfathering 기간을 3개월로 둘지 6개월로 둘지
- 연간 해지/환불 정책을 어떻게 설계할지

## 16. 출시 버전 요금제 v1 확정 (2026-03-25)

### 16.1 원칙

- 출시 초기에는 요금제 수를 줄이고 전환 포인트를 명확하게 만든다.
- 개인은 `무료 / 프리미엄` 2단으로 단순화한다.
- 시설은 `무료 / 라이트 / 프리미엄 + 엔터프라이즈 문의형`으로 단순화한다.
- 무료는 체험형, 유료는 실제 운영 가치가 보이도록 설계한다.

### 16.2 개인 요금제 확정안

#### 개인 2단 (무료 / 프리미엄)

기존 베이직과 프리미엄은 하나로 합치고, 무료와 프리미엄의 차이를 명확하게 만든다.

| 기능 | 무료 (0원) | 프리미엄 (4,900원/월) |
|------|:---:|:---:|
| 시설 지도 검색 | O | O |
| AI 상담 | 카테고리당 1건 | 무제한 |
| 상조 AI 비교상담 | 5회 | 무제한 |
| 즐겨찾기 | 5개 | 무제한 |
| 엔딩노트 | 기본 항목만 | 전체 + PDF + 가족공유 (3명) |
| 예약 / 리뷰 | O | O |
| 광고 | 있음 | 제거 |
| 제휴 할인 | X | 5% |
| VIP 배지 | X | O |
| 전담 상담 우선 연결 | X | 출시 v1 제외 |

확정 이유:

- 가격은 `4,900원/월`로 확정한다. `3,900원`은 가치 인식이 약하고, `5,900원`은 초기 전환 장벽이 높다.
- 무료 AI 상담은 `전체 2건`보다 `카테고리당 1건`이 체험 가치가 높다.
- 무료 즐겨찾기는 `3개`보다 `5개`가 탐색 단계 사용자에게 더 자연스럽다.
- 엔딩노트 전체 + PDF + 가족공유를 프리미엄 핵심 가치로 둔다.
- `전담 상담 우선 연결`은 운영 SLA가 없으므로 출시 v1에서는 제외한다.

확정 메모:

- 개인 요금제는 `무료 / 프리미엄` 2단으로 간다.
- 프리미엄 가격은 `4,900원/월`로 고정한다.
- 베이직 플랜은 제거한다.
- 무료는 체험형, 프리미엄은 엔딩노트/광고 제거/무제한 사용 중심으로 설계한다.

### 16.3 시설 요금제 확정안

#### 시설 3단 + 엔터프라이즈 문의형

시설은 단순 소비가 아니라 `예약/계약 접수`, `승인/취소/대기 처리`, `리뷰 대응`, `알림 발송`, `운영 통계`, `노출 관리` 같은 운영 효율을 구매하는 구조로 본다.

| 기능 | 무료 (0원) | 라이트 (49,000원/월) | 프리미엄 (199,000원/월) |
|------|:---:|:---:|:---:|
| 시설 정보 등록/수정 | O | O | O |
| 사진 업로드 | 5장 | 20장 | 무제한 |
| AI 채팅 상담 | 10회 | 50회 | 무제한 |
| 알림톡/문자 발송 | X | 50건 | 무제한 |
| 이메일 예약 알림 | O | O | O |
| 리뷰 조회 | O | O | O |
| 리뷰 답글 | X | O | O |
| 통계 리포트 | X | 기본 | 상세 + 방문 통계 |
| 노출 순위 | 일반 | 일반 | 우선 노출 |
| 인증 배지 | X | X | 실버 |

엔터프라이즈:

- 가격 비공개
- `별도 문의`로만 표시
- 체인/복수 지점/맞춤 계약 대상

확정 이유:

- 무료는 입점 체험용으로 두되, 실제 운영 효율 기능은 제한한다.
- 라이트는 `실제 운영 가능한 최소 플랜`으로 둔다.
- 프리미엄은 `노출 + 상담 + 운영 자동화 강화` 가치에 집중한다.
- 엔터프라이즈는 self-serve 결제보다 영업 대응이 적합하다.

확정 메모:

- 시설 요금제는 `무료 / 라이트 / 프리미엄 + 엔터프라이즈 문의형`으로 간다.
- 무료는 체험형, 라이트는 운영형, 프리미엄은 성장형으로 포지셔닝한다.
- `리뷰 답글`, `기본 통계`, `알림 50건`은 라이트 핵심 가치로 본다.
- 프리미엄은 단순 수량 증가가 아니라 우선 노출과 운영 효율 강화 플랜으로 설명한다.

### 16.4 상조 요금제 확정안

#### 상조 출시 v1: 파일럿 1개만 공개

상조는 현재 플랫폼이 `상담/리드` 단계까지는 확인할 수 있지만, 실제 계약 성사 여부를 자동으로 확인하기 어렵다. 따라서 출시 v1에서는 `성과 수수료형`보다 `고정 파일럿 비용형`이 더 안전하다.

| 기능 | 파일럿 (150만원/월, 3개월) |
|------|:---:|
| AI 24시간 자동 상담 | O |
| AI 계약 클로징 유도 | O |
| 리드 전달 | O |
| 실시간 매출/성과 리포트 | O |
| 노출 | 우선 노출 |
| 파일럿 기간 | 3개월 |
| 파일럿 종료 후 | `SJ_STARTER` 정가 전환 협의 |

출시 시 노출 정책:

- `SJ_STARTER`만 파일럿형으로 공개
- `SJ_PROFESSIONAL`, `SJ_ENTERPRISE`는 출시 시 비활성화
- 정식 상위 플랜은 파일럿 종료 후 성과 데이터 기준으로 별도 협의

확정 이유:

- 실적 없는 플랫폼에서 `300만~1,500만` 고정비를 바로 설득하기 어렵다.
- 현재 구조상 실계약 여부를 플랫폼이 직접 확인하기 어려워 수수료형은 분쟁 가능성이 높다.
- `150만원/월, 3개월`은 초기 진입 장벽을 낮추면서도 무료/저가 진입으로 보이지 않는 수준이다.
- 초기 목표는 상조 3~5개사 확보와 성과 데이터 축적이다.

운영 원칙:

- 파일럿가는 `월 150만원`, `최소 3개월`로 운영한다.
- 파일럿 종료 후에는 기본 요금제인 `SJ_STARTER 월 300만원` 전환을 기본 원칙으로 둔다.
- 자동 전환 여부보다는 종료 전 사전 안내 후 협의 전환을 원칙으로 한다.
- 수수료 모델은 계약 확인 체계나 CRM 연동이 마련되기 전까지 도입하지 않는다.
