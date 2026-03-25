# Subscription Pricing Migration Plan

작성일: 2026-03-24  
목적: 구독 요금 개편 전략 문서를 실제 개발/운영 작업으로 연결하기 위한 스키마, 마이그레이션, 결제 호환 계획 정의

## 1. 목표

이번 작업의 목표는 아래 3가지를 동시에 만족하는 것이다.

1. 개인/시설 플랜에 `월간/연간` 결제 주기를 추가한다.
2. 상조 플랜은 기존 canonical id를 유지하면서, 대외 노출은 계약형 플랜 구조로 전환 가능하게 만든다.
3. 기존 활성 구독자와 기존 결제 이력을 깨지 않고 점진적으로 전환한다.

## 2. 비목표

이번 단계에서 바로 하지 않는 일:

- 기존 `plan_id` 체계를 전면 폐기
- 기존 활성 구독자의 가격을 강제 변경
- 상조 영업 프로세스 전체를 새 CRM으로 분리
- 결제 PG 교체

## 3. 현재 전제

전략 문서 `docs/04-report/subscription_pricing_research_20260324.md` 기준:

- 개인: `PERSONAL_FREE`, `PERSONAL_BASIC`, `PERSONAL_PREMIUM`
- 시설: `FREE`, `BASIC`, `PREMIUM`, `ENTERPRISE`
- 상조: `SJ_STARTER`, `SJ_PROFESSIONAL`, `SJ_ENTERPRISE`
- 현재 결제/권한 모델은 실질적으로 월 결제 전제

핵심 원칙:

- `plan_id`는 canonical id로 유지
- 결제 주기와 계약 속성은 별도 필드로 분리
- UI 표시 플랜명과 내부 저장 키는 분리 가능해야 함

## 4. 요구사항

### 4.1 기능 요구사항

- 개인/시설 플랜 선택 UI에 `monthly | annual` 토글을 추가할 수 있어야 한다.
- 결제 완료 후 구독 레코드에 `billing_cycle`이 저장되어야 한다.
- 다음 청구일 계산은 `billing_cycle` 기준으로 달라져야 한다.
- 상조 플랜은 내부적으로 기존 `SJ_*` id를 유지하되, 외부에는 별도 노출명을 사용할 수 있어야 한다.
- 기존 월 결제 사용자들은 별도 조치 없이 계속 정상 동작해야 한다.

### 4.2 운영 요구사항

- 기존 활성 구독자에 대한 grandfathering 가능 여부를 운영자가 판단할 수 있어야 한다.
- 연간 결제 시 할인 근거와 금액이 결제 이력에 남아야 한다.
- 상조 계약형 고객은 자동 갱신이 아닌 수동/세일즈 갱신을 표현할 수 있어야 한다.

### 4.3 분석 요구사항

- 월/연간 전환율을 분리 측정할 수 있어야 한다.
- 플랜별 ARR/MRR 집계가 가능해야 한다.
- 상조 계약형의 평균 계약 금액과 유지율을 별도 추적할 수 있어야 한다.

## 5. 제안 스키마

### 5.1 구독 테이블 공통 필드

기존 구독 테이블 또는 관련 subscription row에 아래 필드를 추가한다.

- `billing_cycle text not null default 'monthly'`
- `contract_start_at timestamptz null`
- `contract_end_at timestamptz null`
- `renewal_type text not null default 'auto'`
- `discount_amount numeric null default 0`
- `discount_reason text null`
- `display_plan_name text null`

권장 enum 후보:

- `billing_cycle`: `monthly | annual | pilot | contract`
- `renewal_type`: `auto | manual | sales_renewal`

### 5.2 상조 전용 확장 필드

상조 계약형 운영을 위해 아래 필드를 별도 고려한다.

- `committed_leads integer null`
- `service_credits integer null`
- `commission_rate numeric null`
- `exclusive_region text[] null`
- `onboarding_fee_waived boolean not null default false`

### 5.3 결제 이력 필드

결제 이력 또는 payment row에도 아래 값을 남긴다.

- `billing_cycle`
- `list_price`
- `discount_amount`
- `final_amount`
- `discount_reason`

이유:

- 할인 적용 근거 추적
- 월/연 ARR 분석
- 추후 환불/정산 기준 확보

## 6. plan_id 및 노출명 매핑

### 6.1 개인/시설

개인과 시설은 기존 canonical id를 유지한다.

- `PERSONAL_BASIC` + `billing_cycle=monthly`
- `PERSONAL_BASIC` + `billing_cycle=annual`
- `PREMIUM` + `billing_cycle=monthly`
- `PREMIUM` + `billing_cycle=annual`

즉 같은 플랜의 결제 주기만 분리한다.

### 6.2 상조

상조는 내부 id와 외부 노출명을 분리한다.

권장 매핑:

- `SJ_STARTER` -> `Pilot` 또는 `Growth`
- `SJ_PROFESSIONAL` -> `Performance`
- `SJ_ENTERPRISE` -> `Enterprise`

권장 저장 방식:

- 내부 저장: `plan_id = SJ_*`
- 외부 표기: `display_plan_name = Pilot | Growth | Performance | Enterprise`
- 계약 성격: `billing_cycle = pilot | contract`

## 7. 마이그레이션 전략

### 7.1 Phase 1: 호환 필드 추가

- 신규 컬럼 추가
- 모든 기존 row는 `billing_cycle = monthly`로 백필
- 기존 코드 경로는 변경하지 않고 동작 유지

완료 조건:

- 기존 플랜 화면/권한/결제가 회귀 없이 유지

### 7.2 Phase 2: 읽기 로직 확장

- 프론트/서버에서 `billing_cycle` 읽기 지원
- 다음 청구일 계산 시 월/연 로직 분기
- 관리 화면에서 월/연 구독 상태 표시

완료 조건:

- 기존 사용자와 신규 사용자 모두 정상 조회 가능

### 7.3 Phase 3: 쓰기 로직 확장

- 개인/시설 결제 UI에 월/연 토글 추가
- 연간 결제 시 할인 금액 저장
- 상조는 셀프 결제 대신 문의/계약형 흐름으로 분리 시작

완료 조건:

- 신규 annual 구독 생성 가능
- payment row에 할인/주기 정보 저장

### 7.4 Phase 4: 운영 전환

- 상조 노출 플랜명 변경
- 계약형 제안서/문의 흐름 반영
- 기존 상조 고객은 갱신 시점에만 새 계약 모델 적용

완료 조건:

- 기존 계약 고객 운영 혼선 없이 전환

## 8. 기존 가입자 처리 규칙

### 8.1 개인/시설

- 기존 활성 구독자는 그대로 유지
- 별도 opt-in 없이 자동 annual 전환 금지
- 첫 갱신 시점 이전까지 가격/권한 유지
- annual 전환은 사용자 자발 선택만 허용

### 8.2 상조

- 기존 고객은 현재 계약/과금 체계 유지
- 신규 제안서와 UI는 계약형 메시지로 전환
- 재계약 또는 영업 갱신 시점에만 신규 구조 적용

## 9. 백엔드 변경 포인트

- `lib/queries.ts`
- 시설 구독 갱신/생성 RPC
- 결제 완료 후 구독 row 갱신 함수
- 월 리포트/정산 로직
- 플랜 표시용 타입 정의

예상 변경 범위:

- 플랜 가격 계산 함수
- `next_billing_date` 계산
- 관리 화면 집계 로직
- 결제 영수증/히스토리 표시

## 10. 프론트엔드 변경 포인트

- `components/PersonalSubscriptionPlans.tsx`
- `components/SubscriptionPlans.tsx`
- `components/dashboard/FacilityAdminDashboard.tsx`
- `components/Partner/UpgradeBanner.tsx`
- `components/Partner/UpgradeBenefitComparison.tsx`
- `components/Partner/CommissionSimulator.tsx`

주요 UI 작업:

- 월/연 토글
- 연간 할인 배지
- 할인 전/후 가격 표시
- 상조 계약형 CTA 분리
- 관리 화면 billing cycle 표시

## 11. 데이터 검증 체크리스트

- 기존 활성 구독 row가 모두 `monthly`로 백필되었는가
- annual 결제 생성 시 할인 금액과 다음 청구일이 맞는가
- `plan_id` canonical 값이 기존과 동일한가
- 상조의 `display_plan_name`만 바뀌고 정산 id는 유지되는가
- ARR/MRR 집계가 월/연 혼합 상태에서도 맞는가

## 12. 실험 및 채택 기준

### 12.1 개인

- annual 선택률 15% 이상
- 90일 기준 ARR 순증
- 유료 전환률 하락 폭 5%p 이내

### 12.2 시설

- annual 선택률 10% 이상
- Premium 이상 비중 유지 또는 상승
- 90일 유지율 상승

### 12.3 상조

- 계약형 CTA 전환 후 문의율 유지 또는 상승
- 평균 계약 금액 유지 또는 상승
- 할인 없이도 도입률이 크게 하락하지 않을 것

## 13. 오픈 질문

- 개인 연간 플랜 할인율을 15%로 고정할지 20%까지 허용할지
- 시설 Enterprise를 self-serve annual로 둘지 별도문의로 돌릴지
- 상조 `Pilot`을 실제 결제 가능 플랜으로 둘지, 문의 전용으로 둘지
- grandfathering 기간을 3개월로 둘지 6개월로 둘지
- 연간 환불 정책을 어떻게 둘지

## 14. 권장 실행 순서

1. DB에 호환 필드 추가
2. 백필 및 읽기 호환 적용
3. 개인/시설 annual 결제 도입
4. 분석 이벤트 및 ARR/MRR 집계 추가
5. 상조 노출/세일즈 흐름 분리

## 15. 완료 정의

아래가 모두 만족되면 이 작업은 완료로 본다.

- 기존 구독자가 회귀 없이 유지된다.
- 개인/시설 annual 결제가 실제 생성된다.
- payment history에서 할인과 billing cycle을 확인할 수 있다.
- 상조는 내부 `SJ_*`를 유지한 채 외부 계약형 플랜명으로 운영 가능하다.
- 운영팀이 기존/신규 고객 처리 규칙을 문서로 확인할 수 있다.

## 16. 일정 관점 판단

이번 작업은 범위에 따라 시간이 크게 달라진다.

대략 기준:

- SQL 초안만: 30분~2시간
- DB 마이그레이션 + 타입/쿼리 반영: 반나절~1일
- 백엔드 + 프론트 결제 플로우까지 1차 연결: 1~3일
- 마이그레이션 검증, 기존 가입자 처리, QA 포함: 3~7일

현재처럼 전략 문서와 실행 문서가 이미 있는 상태라면 아래까지는 비교적 빠르게 갈 수 있다.

- 스키마 변경안 설계
- SQL migration 초안
- 영향 코드 매핑
- 백필 전략 수립
- UI/결제 반영 범위 확정

이 범위는 보통 2~3일 안에 의사결정 가능하다.

정확히 말하면:

- 2~3일 안에 가능한 것
  - 스키마 확정
  - SQL 초안 작성
  - 타입/쿼리 영향 범위 정리
  - 기존 가입자 처리 규칙 문서화
  - UI/결제 변경 범위 확정
  - 1차 개발 착수 가능한 상태 만들기

- 2~3일 안에 애매한 것
  - 실제 결제 플로우까지 안정 동작
  - 기존 가입자 이행 검증
  - QA 후 배포
  - 상조 계약형까지 포함한 완결 구현

즉 결론은 아래와 같다.

- 의사결정과 구현 착수 수준까지는 2~3일 가능
- 안전한 배포 수준까지는 보통 3일 이상 필요

권장 3일 일정:

### Day 1

- 스키마 확정
- SQL 초안 작성
- `plan_id` / `display_plan_name` / `billing_cycle` 규칙 확정

### Day 2

- 타입/쿼리 영향도 정리
- 백필 전략 확정
- UI/결제 변경 포인트 확정

### Day 3

- 1차 코드 반영
- 핵심 흐름 검증
- 배포 가능/보류 판단

## 17. Execution Tracks (2026-03-25 GPT 추가)

현재 작업은 아래 2개 트랙으로 분리해서 진행한다.

### Track A: PortOne live integration first

목표:

- 현재 월 구독 구조를 유지한 채 실결제를 먼저 운영 가능 상태로 만든다.
- 요금제 정책 개편과 결제 안정화 리스크를 분리한다.

작업 범위:

- PortOne 가맹점 신청 및 승인 진행
- `verify-payment` 구독 검증 보강
- `SubscriptionPlans.tsx` 결제 흐름 보완
- `PersonalSubscriptionPlans.tsx` 동일 수준 반영
- Vercel / Supabase 운영 환경변수 입력
- 테스트 결제 및 실제 기기 검증

담당 제안:

- 사용자
  - PortOne 가맹점 신청 및 PG 승인 대응
  - 운영 키 / 환경변수 입력
  - 실결제 최종 승인 테스트
- Claude
  - `verify-payment` 검증 보강
  - 결제 공통 흐름 정리
  - `SubscriptionPlans.tsx` / `PersonalSubscriptionPlans.tsx` 반영
  - 테스트 결제 검증 지원 및 결과 문서화
- GPT
  - 신청 체크리스트 및 정책 문서 정리
  - 트랙 전환 기준 문서화

완료 기준:

- 운영 환경에서 월 구독 결제가 정상 승인된다.
- 결제 성공 후 구독 상태와 결제 이력이 일관되게 저장된다.
- PC / 모바일에서 결제 흐름이 모두 재현 가능하다.

### Track B: Pricing migration after A stabilization

목표:

- 월/연간 토글, 할인, 상조 계약형 CTA 분리, 기존 가입자 이행까지 단계적으로 반영한다.

작업 범위:

- `billing_cycle` 등 스키마 확장
- 타입 및 쿼리 반영
- 월/연간 토글 및 할인 배지 UI
- 상조 계약형 CTA 분리
- 기존 가입자 백필 및 검증

담당 제안:

- GPT
  - 스키마 초안 및 정책 문서 정리
  - 프론트 UI 초안
  - 상조 계약형 CTA 분리 설계
- Claude
  - 타입 / 쿼리 반영
  - 백필 및 데이터 검증
  - 기존 가입자 안전성 검토
- 사용자
  - 할인 정책 / 운영 정책 최종 승인
  - 상조 계약형 운영 여부 확정

완료 기준:

- 월간 / 연간 표시와 결제 데이터 구조가 일치한다.
- 기존 가입자는 안전하게 `monthly` 기준으로 유지 또는 백필된다.
- 상조는 일반 구독과 구분된 CTA 및 운영 흐름을 가진다.

## 18. Recommended sequence

1. PortOne 신청
2. Track A 실결제 MVP 연결
3. 운영 검증 및 오류 수습
4. 최소 스키마 확정
5. Track B 요금제 개편 착수

현재 권장 원칙:

- 결제 안정화가 요금제 개편보다 우선이다.
- 요금제 개편은 스키마와 정책을 먼저 확정하고 점진 반영한다.
- 상조 계약형 CTA 분리는 Track B에서 별도 설계로 다룬다.

## 19. 코드 실측 검증 (2026-03-25 Claude 검증)

검증일: 2026-03-25
검증 대상: 문서 내용 vs 실제 코드베이스 상태

### 19.1 일치 확인 (정상)

| 문서 주장 | 실제 파일 | 상태 |
|-----------|-----------|------|
| `lib/portone.ts` 존재 | SDK 연동, 모바일/PC 감지, `requestPayment`/`verifyPayment` 구현 | 일치 |
| `verify-payment` Edge Function | JWT 검증 + 소유권 + 금액 이중검증 구현 | 일치 |
| `facility_subscription` 검증 분기 | `planExists` + `facilityOwned` 검증 구현 | 일치 |
| `personal_subscription` 검증 분기 | `planExists` + `isOwner` 검증 구현 | 일치 |
| `SubscriptionPlans.tsx` 존재 | 시설 구독 결제 UI, `requestPayment`/`verifyPayment` import 확인 | 일치 |
| `PersonalSubscriptionPlans.tsx` 존재 | 개인 구독 결제 UI, 동일 import 구조 | 일치 |
| `billing_cycle` 등 필드 미추가 | DB에 없음 (Phase 1 미착수) | 일치 |

### 19.2 발견된 이슈

#### ISSUE-1: `subscription_payments` insert 로직 누락 가능성 (Track A 블로커)

- `verify-payment` Edge Function은 **검증만** 수행하고, `subscription_payments` row를 생성하지 않음
- 프론트(`SubscriptionPlans.tsx`, `PersonalSubscriptionPlans.tsx`)에서 검증 후 직접 insert하는 흐름인지 **미확인**
- **결제 이력이 빠지면 MVP 완료 불가**
- 조치: Track A 착수 시 결제→검증→구독갱신→이력저장 전체 흐름을 E2E로 추적 필요

#### ISSUE-2: `subscription_plans` 테이블 실존 여부 미확인

- `verify-payment`에서 `verifySubscriptionPlanExists()`가 `subscription_plans.name_en`으로 조회
- 이 테이블이 실제 DB에 존재하고 데이터가 있는지 **Supabase SQL Editor에서 확인 필요**
- 없으면 모든 구독 결제 검증이 실패함

```sql
SELECT id, name_en, price FROM subscription_plans ORDER BY id;
```

#### ISSUE-3: 문서 간 범위 중복

- `portone_live_integration_mvp_checklist_20260324.md`와 Track A 범위가 거의 동일
- 실행 기준 문서를 단일화하거나, MVP 체크리스트를 Track A의 세부 체크리스트로 명시 링크 권장

### 19.3 Track A 착수 전 필수 확인 사항

1. **Supabase SQL Editor에서 확인**:
   - `subscription_plans` 테이블 존재 + 데이터 확인
   - `subscription_payments` 테이블 존재 + 컬럼 구조 확인
   - `facility_subscriptions` / `user_subscriptions` 현재 row 수 확인

2. **환경변수 확인**:
   - Vercel: `VITE_PORTONE_STORE_ID`, `VITE_PORTONE_CHANNEL_KEY` 설정 여부
   - Supabase Edge Function: `PORTONE_API_SECRET` 설정 여부

3. **PortOne 가맹점 신청 상태**: 승인 전이면 테스트 키로 먼저 연동 검증

### 19.4 참조 문서

- Track A 세부 체크리스트: `docs/04-report/portone_live_integration_mvp_checklist_20260324.md`
- 요금 구조 리서치: `docs/04-report/subscription_pricing_research_20260324.md`
- PortOne 신청 준비물: `docs/01-plan/portone_application_checklist_memorimap_20260325.md`

## 20. 출시 버전 요금제 v1 (2026-03-25 Claude 제안)

### 20.1 설계 원칙

- **먼저 모이게 하고, 나중에 과금** — 유저 없이 요금제를 다듬는 건 빈 가게에서 메뉴판만 고치는 것
- 출시 초기에는 유저 수 확보가 매출보다 중요
- 데이터 수집 후 A/B 테스트로 가격/기능 조정
- 플랜 수 최소화 (10개 → 6개) — 선택 피로 감소, 관리 비용 절감

### 20.2 현재 문제 분석

#### 개인 플랜

- 베이직/프리미엄 차이가 모호 — 유저 입장에서 어느 걸 골라야 할지 불명확
- 무료→베이직 전환 동기 약함 — AI 상담 1건→3건 차이로 4,900원 지불 유인 부족
- 장례/추모 앱은 일상 앱이 아님 — 사용 빈도 낮으면 광고 제거 가치도 낮음

#### 시설 플랜

- 0원→99,000원 간극이 너무 큼 (30배 점프) — 중소 시설 이탈
- 무료 기능이 너무 빈약 (사진 3장, AI/문자 없음) — "체험"이 안 됨
- 엔터프라이즈 499,000원은 체인 시설 아니면 접근 불가

#### 상조 플랜

- 실적 없는 플랫폼에서 월 300만~1,500만 고정비 설득 불가
- ROI 불명확 — "네이버 광고에 같은 돈 쓰면?"과 비교당함
- 리드 0건이어도 300만원 — 사업자 리스크 큼

### 20.3 제안 요금제 v1

#### 개인 — 2단 (무료 / 프리미엄)

기존 베이직과 프리미엄을 하나로 합쳐 선택을 단순화한다.

| 기능 | 무료 (0원) | 프리미엄 (4,900원/월) |
|------|:---:|:---:|
| 시설 지도 검색 | O | O |
| AI 상담 | 전체 2건 | **무제한** |
| 상조 AI 비교상담 | 5회 | **무제한** |
| 즐겨찾기 | 3개 | **무제한** |
| 엔딩노트 | 기본 항목만 | **전체 + PDF + 가족공유 (3명)** |
| 예약 / 리뷰 | O | O |
| 광고 | 있음 | **제거** |
| 제휴 할인 | X | 5% |
| VIP 배지 | X | O |
| 전담 상담 우선 연결 | X | O |

변경 이유:

- 4,900원은 커피 한 잔 수준 — 심리적 부담 낮음
- 무료 제한을 타이트하게 → "한 번 더 쓰고 싶은데..." 에서 전환 유도
- 엔딩노트 전체 + PDF + 가족공유를 프리미엄 핵심 가치로 — 감정적 가치가 기능적 가치보다 전환 동기 강함

#### 시설 — 3단 (무료 / 라이트 / 프리미엄) + 엔터프라이즈 별도문의

| 기능 | 무료 (0원) | 라이트 (49,000원/월) | 프리미엄 (199,000원/월) |
|------|:---:|:---:|:---:|
| 시설 정보 등록/수정 | O | O | O |
| 사진 업로드 | 5장 | 20장 | **무제한** |
| AI 채팅 상담 | 10회 | 50회 | **무제한** |
| 알림톡/문자 발송 | X | 50건 | **무제한** |
| 이메일 예약 알림 | O | O | O |
| 리뷰 조회 | O | O | O |
| 리뷰 답글 | X | O | O |
| 통계 리포트 | X | 기본 | **상세 + 방문 통계** |
| 노출 순위 | 일반 | 일반 | **우선 노출** |
| 인증 배지 | X | X | **실버** |

엔터프라이즈: 출시 시 가격 공개하지 않고 "별도 문의"로만 표시. 체인/대형 시설 대상 영업으로 전환.

변경 이유:

- 무료 기능 상향 (사진 3→5, AI 0→10) — 체험 가치 제공
- 49,000원 라이트 추가 — 0→10만 간극 해소, 첫 결제 허들 낮춤
- 기존 베이직(99K)과 프리미엄(299K) 합쳐서 199,000원 — 가격 경쟁력
- 엔터프라이즈는 출시 때 셀프 결제로 열지 않음

#### 상조 — 파일럿 1개만

| 기능 | 파일럿 (150만원/월, 3개월) |
|------|:---:|
| AI 24시간 자동 상담 | O |
| AI 계약 클로징 유도 | O |
| 리드 전달 | O |
| 실시간 매출/성과 리포트 | O |
| 노출 | 우선 노출 |
| 수수료 | 계약 성사 시 8% |
| 3개월 후 | 실적 기반으로 정가 플랜 협의 |

변경 이유:

- 300만~1,500만 고정비는 실적 없는 플랫폼에서 설득 불가
- 150만원 파일럿 + 성과 수수료 → 사업자 리스크 분산
- 3개월 실적 데이터 모은 후 STARTER/PROFESSIONAL 정식 오픈
- 초기 목표: 상조 3~5개사 파일럿 확보

### 20.4 v1 vs 현재 비교

| 구분 | 현재 | v1 제안 |
|------|------|---------|
| 개인 | 3단 (무료/베이직 4,900/프리미엄 9,900) | **2단 (무료/프리미엄 4,900)** |
| 시설 | 4단 (0/99K/299K/499K) | **3단 (0/49K/199K) + 엔터프라이즈 별도문의** |
| 상조 | 3단 (300만/800만/1,500만) | **파일럿 1개 (150만 + 수수료 8%)** |
| 총 플랜 수 | 10개 | **6개** |

### 20.5 DB 변경 영향

v1 적용 시 `subscription_plans` 테이블 변경:

- 개인: `PERSONAL_BASIC` 삭제 또는 비활성화, `PERSONAL_PREMIUM` 가격 4,900으로 변경
- 시설: `BASIC` → `LIGHT` 이름 변경 + 가격 49,000, `PREMIUM` 가격 299,000→199,000, `ENTERPRISE` 비활성화 (별도 문의)
- 상조: `SJ_STARTER` 가격 3,000,000→1,500,000 + `billing_cycle=pilot` 표기, `SJ_PROFESSIONAL`/`SJ_ENTERPRISE` 비활성화
- 소문자 중복 행 (`free`, `basic`, `premium`, `enterprise`) 정리

프론트 변경:

- `PersonalSubscriptionPlans.tsx`: 베이직 제거, 프리미엄 가격/기능 조정
- `SubscriptionPlans.tsx`: 라이트 추가, 프리미엄 가격 조정, 엔터프라이즈 "별도 문의" 처리
- `types/subscription.ts`: 쿼터 값 조정 (무료 제한 변경분)
- `hooks/useUserPlan.ts`, `hooks/useQuotaGate.ts`: 쿼터 기준 변경

### 20.6 연간 결제 (v2 — 출시 후)

출시 후 데이터 수집 → 전환율 분석 → 연간 결제 도입:

| 구분 | 월간 | 연간 | 할인율 |
|------|------|------|--------|
| 개인 프리미엄 | 4,900원/월 | 49,980원/년 (4,165원/월) | 15% |
| 시설 라이트 | 49,000원/월 | 499,800원/년 (41,650원/월) | 15% |
| 시설 프리미엄 | 199,000원/월 | 2,028,000원/년 (169,000원/월) | 15% |

### 20.7 A/B 테스트 계획 (출시 후)

#### 테스트 1: 개인 무료 제한 강도

- 그룹 A: AI 전체 2건, 즐겨찾기 3개 (v1 기본)
- 그룹 B: AI 카테고리당 1건, 즐겨찾기 5개 (현재)
- 측정: 유료 전환율

#### 테스트 2: 시설 라이트 가격

- 그룹 A: 49,000원
- 그룹 B: 39,000원
- 측정: 첫 유료 전환율

#### 테스트 3: 상조 파일럿 수수료

- 그룹 A: 기본료 150만 + 수수료 8%
- 그룹 B: 기본료 100만 + 수수료 10%
- 측정: 도입율, 3개월 후 정가 전환율

### 20.8 실행 순서

1. 요금제 v1 최종 확정 (사용자 승인)
2. `subscription_plans` DB 업데이트
3. 프론트 코드 반영 (PersonalSubscriptionPlans, SubscriptionPlans)
4. 쿼터/기능 제한 코드 반영 (useUserPlan, useQuotaGate)
5. PortOne 승인 후 실결제 연동 (Track A)
6. 출시
7. 1개월 후 데이터 기반 A/B 테스트 시작
8. 안정 후 연간 결제 + 상조 정식 플랜 오픈 (Track B)

### 20.9 승인 상태

- [ ] 사용자 최종 승인 대기
- [ ] 가격/기능 구성 확정
- [ ] DB 변경 착수 가능
