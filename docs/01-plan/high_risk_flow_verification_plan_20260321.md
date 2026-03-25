# 고위험 흐름 검증 실행 계획서

작성일: 2026-03-21

목적:
현재 코드베이스에서 이미 정리된 구조, 데이터, 권한 기준을 유지한 채 남아 있는 고위험 영역을 Playwright 중심으로 검증 가능한 상태로 고정한다. 이 문서는 기능 추가 문서가 아니라, 데이터 정합성, 권한 무결성, 재조회 일관성을 자동화로 묶기 위한 실행 문서다.

적용 원칙:
- 데이터가 먼저다. UI가 맞아 보여도 재조회 후 같은 상태가 아니면 실패로 본다.
- 권한은 UI가 아니라 서버 기준이다. Edge Function, RPC, 승인/리포트 흐름은 서버 인증으로 검증한다.
- UI는 수정하지 않는다. JSX, DOM, className, CSS, Tailwind, 문구, 버튼 위치, 레이아웃은 건드리지 않는다.
- 흐름 단위로 검증한다. 진입 -> 상태 결정 -> 저장 -> 재조회 -> 후속 반영 순서로 본다.
- 현재 코드 기준으로만 판단한다. 이미 해결된 이슈는 다시 문제로 적지 않는다.

---

## 1. 실행 계획서

### 왜 이 순서인가

1. 플랜 / 구독 / 상태 반영이 최우선이다.
- 구독 상태와 `plan_id`가 어긋나면 이후 모든 권한, 노출, 과금, 추천 흐름의 판단 기준이 흔들린다.
- 현재 코드에는 `facility_subscriptions`, `user_subscriptions`, `subscription_plans`가 병렬로 존재하므로 canonical 값 기준 검증이 먼저 고정돼야 한다.

2. AI 상담 / 비교 흐름은 두 번째다.
- 이 영역은 상태가 UI에서만 움직이는 것처럼 보여도 실제로는 `useChatStore`, quota RPC, lead/consultation 저장과 연결된다.
- 추천 결과는 재조회로 남지 않더라도 후속 이동과 DB 기록이 남아야 하므로, 앞선 구독 상태가 안정화된 뒤 검증해야 원인 분리가 가능하다.

3. 상조 파트너 영역은 세 번째다.
- 업그레이드 배너, 시뮬레이터, revenue tab은 모두 현재 plan을 기준으로 계산된다.
- 구독 정합성이 먼저 맞아야 계산식과 표시값이 의미를 가진다.

4. Edge Function 영향 흐름은 마지막에 smoke로 고정한다.
- `send-monthly-report`는 서버 인증, 대상 필터, no-op, 실패, 성공이 모두 분리되어야 한다.
- 상위 흐름의 데이터가 맞아야 리포트 대상 판정도 정확해진다.

### 우선순위별 리스크

| 우선순위 | 핵심 리스크 | 실패 시 영향 |
| --- | --- | --- |
| P0 | canonical `plan_id` 불일치, update 대신 insert, 재조회 불일치 | 모든 구독/권한/요금 계산 신뢰도 하락 |
| P1 | AI 상담 진입과 후속 이동이 state만 바뀌고 DB가 남지 않음 | 상담 접수, 추천, 비교, 예약 연결의 회귀를 놓침 |
| P2 | 상조 파트너 계산이 현재 플랜과 다른 기준으로 동작 | 배너, 시뮬레이터, revenue 탭이 잘못된 업셀을 유도 |
| P3 | Edge Function이 인증만 맞고 대상 필터가 잘못됨 | 월간 리포트 누락 또는 오발송 |

### 검증 포인트

- 저장값과 재조회값이 같은지 확인한다.
- `plan_id`는 `normalizeSubscriptionPlanId`와 `subscription_plans.id` 기준으로만 판단한다.
- UI 표시는 보조값이고, DB row와 canonical key가 일치해야 한다.
- 동일 동작 후 중복 row가 생성되지 않는지 확인한다.
- 권한 없는 호출은 UI가 아니라 서버에서 차단되는지 확인한다.

### 선행 조건

- `tests/e2e/db.utils.ts`의 service role 기반 DB 접근이 가능해야 한다.
- `tests/e2e/coreFlows.fixture.ts`의 사용자 생성 및 정리 패턴을 재사용한다.
- `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`가 `.env.local`에 있어야 한다.
- Playwright 테스트는 현재 UI 셀렉터 기준으로만 작성한다.

### 완료 기준

- 아래 4개 E2E 파일이 각각 독립적으로 실행 가능해야 한다.
- 각 파일은 UI 확인과 DB 확인을 함께 포함해야 한다.
- 실패 케이스는 실패로, no-op 케이스는 no-op으로, 성공 케이스는 성공으로 분리된다.
- 재조회 후 동일 상태가 유지되는지 확인된다.

---

## 2. 테스트 파일 계획

### `tests/e2e/subscription.flow.spec.ts`

목적:
- 무료 -> 유료 -> 무료 전환이 canonical `plan_id` 기준으로 저장되고 재조회 후에도 유지되는지 검증한다.
- `facility_subscriptions`와 `user_subscriptions`의 흐름을 분리해서 본다.

커버 범위:
- `PersonalSubscriptionPlans.tsx`
- `SubscriptionPlans.tsx`
- `lib/queries.ts`의 `updateFacilitySubscription`
- `subscription_plans` 조인 결과
- 무료/유료 전환 후 refresh 재조회

검증할 DB 값:
- `facility_subscriptions.plan_id`
- `facility_subscriptions.status`
- `facility_subscriptions.next_billing_date`
- `facility_subscriptions.updated_at`
- `subscription_plans.id`
- `subscription_plans.name_en`
- 개인 플랜이면 `user_subscriptions.plan_id`
- 개인 플랜이면 `user_subscriptions.status`

검증할 UI 포인트:
- 마이페이지 진입 버튼
- 파트너 revenue 탭의 요금제 관리 버튼
- 현재 구독명, 다음 결제일, 업그레이드 안내 문구
- 무료 플랜 저장 후 현재 표시가 즉시 바뀌는지
- 새로고침 후 표시가 DB와 같은지

flaky 방지 전략:
- 플랜 변경 전후에 marker가 들어간 단일 fixture facility/user만 사용한다.
- 저장 직후에는 `maybeSingle()`로 해당 row를 바로 재조회한다.
- `expect.poll`은 저장 전파 확인에만 제한적으로 사용한다.
- UI는 텍스트 기반으로 확인하고, DB는 row count와 값 일치를 동시에 본다.
- 중복 row 여부는 동일 `facility_id` 또는 `user_id` 기준으로 1건만 남는지 확인한다.

### `tests/e2e/ai.compare.spec.ts`

목적:
- `useChatStore` 기반 AI 진입 상태와 상담/비교 후속 이동이 실제로 이어지는지 검증한다.
- 마음이 추천, 마음이AI 비교, 상조 비교가 각각 독립적으로 동작하는지 검증한다.

커버 범위:
- `stores/useChatStore.ts`
- `components/TopBar.tsx`의 긴급 진입
- `components/AI/ChatInterface.tsx`
- `components/Consultation/SangjoConsultationModal.tsx`
- `components/ComparisonModal.tsx`
- `components/SangjoComparisonModal.tsx`
- `components/RecommendationStarter.tsx`
- `hooks/useComparison.ts`

검증할 DB 값:
- `user_subscriptions.ai_consult_by_category`
- `user_subscriptions.sangjo_compare_used`
- `leads.status`
- `leads.category`
- `leads.urgency`
- `consultations.facility_id`
- `consultations.user_id`
- `consultations.status`
- `sangjo_contracts.sangjo_id`
- 필요 시 `ai_consultations.status`

검증할 UI 포인트:
- 글로벌 AI 오픈 상태가 `useChatStore`로 열리는지
- AI 마음이 진입 시 환영 문구와 선택 버튼이 뜨는지
- 추천 결과가 3개 기준으로 표시되는지
- 비교 추가/제거 후 비교 모달이 열리는지
- 상조 비교 결과에서 다음 액션이 상담/계약/예약으로 이어지는지

flaky 방지 전략:
- AI 응답 자체는 최종 텍스트보다 후속 상태와 DB 기록을 우선 확인한다.
- 추천 결과는 순서가 바뀔 수 있으므로 개수와 타입, 후속 버튼 노출만 본다.
- compare list는 local state이므로 UI 상태 확인과 함께 후속 모달 오픈 여부를 검증한다.
- 상담/리드 생성은 저장 후 `leads`와 `consultations`를 직접 조회한다.
- quota RPC는 첫 진입 1회만 확인하고, 반복 클릭으로 상태 오염이 생기지 않게 한다.

### `tests/e2e/partner.revenue.spec.ts`

목적:
- 상조 파트너 영역에서 업그레이드 배너, simulator, revenue tab이 현재 플랜 기준으로 계산되고 표시되는지 검증한다.
- 플랜 변경 후 계산값이 즉시 바뀌고 재조회 후에도 유지되는지 검증한다.

커버 범위:
- `components/Partner/UpgradeBanner.tsx`
- `components/Partner/UpgradeBenefitComparison.tsx`
- `components/Partner/CommissionSimulator.tsx`
- `components/Partner/PartnerRevenueTab.tsx`
- `components/Partner/PartnerDashboard.tsx`
- `components/SubscriptionPlans.tsx`의 `type="sangjo"`

검증할 DB 값:
- `facility_subscriptions.plan_id`
- `facility_subscriptions.plan_name`
- `facility_subscriptions.status`
- `facility_subscriptions.next_billing_date`
- `subscription_payments.subscription_id`
- `subscription_payments.status`
- `consultations.created_at`
- `reservations.visit_date`
- `system_settings`의 `sj_*_commission` 값

검증할 UI 포인트:
- sidebar의 `요금제 관리` 탭 진입
- `요금제 변경` / `요금제 선택` 버튼 노출
- `UpgradeBanner` 추천 문구와 이동 버튼
- `CommissionSimulator`의 현재 플랜, 다음 플랜, 총 비용 비교
- `PartnerRevenueTab`의 현재 구독명, 월간 상담 수, 월간 예약 수

flaky 방지 전략:
- current plan은 `normalizeSubscriptionPlanId` 결과를 기준으로만 본다.
- 시뮬레이터는 입력값을 고정하고, 계산식은 DOM 텍스트보다 DB 플랜 기준으로 교차 확인한다.
- 배너는 localStorage dismiss 상태에 영향을 받으므로 테스트 시작 시 해당 키를 초기화한다.
- revenue 탭 데이터는 월 기준이므로 fixture의 created_at을 현재 월로 맞춰 넣는다.
- 상담 수와 예약 수는 각각 별도 row로 검증한다.

### `tests/e2e/report.smoke.spec.ts`

목적:
- `send-monthly-report` Edge Function이 인증, 실패, 성공, no-op을 구분해서 응답하는지 검증한다.
- 대상 필터가 active sangjo subscription과 canonical `sj_*` plan만 포함하는지 확인한다.

커버 범위:
- `supabase/functions/send-monthly-report/index.ts`
- 서버 인증 헤더 검증
- `facility_subscriptions` 대상 필터
- `sangjo_hq_admins` -> `profiles` 이메일 조회
- `consultations`, `sangjo_contracts`, `reservations` 집계

검증할 DB 값:
- `facility_subscriptions.plan_id`
- `facility_subscriptions.status`
- `sangjo_hq_admins.sangjo_id`
- `profiles.email`
- `consultations.facility_id`
- `sangjo_contracts.sangjo_id`
- `reservations.facility_id`

검증할 UI 포인트:
- 이 파일은 UI를 열지 않는 smoke 테스트다.
- 필요 시 최소한의 서버 호출 결과만 검증한다.

flaky 방지 전략:
- 실제 메일 발송은 하지 않고 Resend 호출은 stub 또는 mock으로 처리한다.
- 인증 실패는 잘못된 bearer token으로 고정한다.
- no-op은 active sangjo subscription이 없는 fixture로 만든다.
- 성공 케이스는 `sj_starter`, `sj_professional`, `sj_enterprise` 중 하나만 active로 넣고, 나머지는 비활성화한다.
- 결과는 `reportsGenerated`, `emailsSent`, `errors`, `reason` 필드로 판정한다.

---

## 3. 실행 순서

### Step 1. 기준선 확인

- 먼저 확인할 것:
  - `docs/stagewise_plan_master_20260321.md`
  - `docs/structure_summary_and_verification_master_20260320.txt`
  - `tests/e2e/db.utils.ts`
  - `tests/e2e/coreFlows.fixture.ts`
- 구현할 것:
  - 테스트에 쓸 fixture 전략과 DB 정리 규칙을 확정한다.
  - canonical `plan_id`, quota RPC, lead/consultation 저장 위치를 기준으로 삼는다.
- 통과 기준:
  - 각 영역의 DB 대상 테이블과 UI 진입점이 한 줄로 대응된다.
- 다음 단계로 넘어가는 조건:
  - 중복 해석이 필요한 SQL이나 오래된 문서 기준이 제거되어 있다.

### Step 2. 구독 정합성 고정

- 먼저 확인할 것:
  - `PersonalSubscriptionPlans.tsx`
  - `SubscriptionPlans.tsx`
  - `lib/subscriptionPlanIds.ts`
  - `lib/queries.ts`의 구독 저장 함수
- 구현할 것:
  - 무료 저장, 유료 결제 후 저장, 재조회 일치 여부를 테스트 시나리오로 고정한다.
  - `facility_subscriptions`와 `user_subscriptions`를 분리해서 검증한다.
- 통과 기준:
  - 저장 후 새로고침해도 같은 `plan_id`와 상태가 보인다.
  - 동일 동작에서 중복 row가 생기지 않는다.
- 다음 단계로 넘어가는 조건:
  - canonical key 기준으로만 구독이 보인다.

### Step 3. AI 상담 / 비교 흐름 고정

- 먼저 확인할 것:
  - `stores/useChatStore.ts`
  - `components/AI/ChatInterface.tsx`
  - `components/Consultation/SangjoConsultationModal.tsx`
  - `hooks/useComparison.ts`
- 구현할 것:
  - AI 진입, 추천 결과, 다음 액션, 비교 모달, 리드/상담 저장을 한 흐름으로 묶는다.
  - 마음이 추천과 상조 비교를 별도 케이스로 분리한다.
- 통과 기준:
  - UI 상태가 바뀌는 것만이 아니라 `leads` 또는 `consultations`가 실제로 남는다.
  - quota RPC가 올바른 카테고리로 1회만 증가한다.
- 다음 단계로 넘어가는 조건:
  - 후속 이동이 DB 기록과 연결된다.

### Step 4. 상조 파트너 영역 고정

- 먼저 확인할 것:
  - `components/Partner/PartnerDashboard.tsx`
  - `components/Partner/PartnerRevenueTab.tsx`
  - `components/Partner/UpgradeBanner.tsx`
  - `components/Partner/CommissionSimulator.tsx`
- 구현할 것:
  - 현재 플랜에 따라 배너 추천, 시뮬레이터 계산, revenue 탭 표시를 검증한다.
  - 플랜 변경 후 계산값이 즉시 반영되는지 확인한다.
- 통과 기준:
  - banner, simulator, revenue tab이 모두 같은 plan 기준으로 나온다.
  - 재조회 후에도 같은 값이 유지된다.
- 다음 단계로 넘어가는 조건:
  - partner 영역의 계산과 표시가 구독 정합성과 일치한다.

### Step 5. Edge Function smoke 고정

- 먼저 확인할 것:
  - `supabase/functions/send-monthly-report/index.ts`
  - `supabase/migrations/20260227_feature_gating.sql`
  - `supabase/migrations/20260320_fix_duplicate_facility_and_ai_consult.sql`
- 구현할 것:
  - 인증 실패, no-op, 성공, 데이터 조회 실패를 분리해서 smoke 시나리오로 만든다.
  - 대상 필터가 canonical `sj_*` active subscription만 잡는지 확인한다.
- 통과 기준:
  - unauthorized는 401, no-op은 200 + no-op reason, 실패는 500 또는 명시적 error, 성공은 reportsGenerated/emailsSent 증가로 구분된다.
- 다음 단계로 넘어가는 조건:
  - 서버 호출만으로 상태를 판정할 수 있다.

### Step 6. 회귀 고정

- 먼저 확인할 것:
  - 새 테스트 파일 4개
  - 공용 fixture와 DB cleanup
- 구현할 것:
  - 각 파일을 독립적으로 실행해도 이전 파일의 데이터가 영향을 주지 않도록 만든다.
  - marker 기반 테스트 데이터를 사용한다.
- 통과 기준:
  - 4개 파일이 서로 간섭 없이 실행된다.
  - 실패 시 실패 지점이 UI인지 DB인지 서버인지 구분된다.
- 다음 단계로 넘어가는 조건:
  - 배포/수정 시 회귀를 빠르게 잡을 수 있는 수준의 자동화가 된다.

---

## 4. 권장 구현 순서 요약

1. 구독 저장과 재조회 정합성을 고정한다.
2. AI 상담과 비교 흐름을 DB 기록까지 묶는다.
3. 상조 파트너 revenue와 업그레이드 계산을 현재 플랜 기준으로 고정한다.
4. `send-monthly-report`를 smoke로 나눈다.
5. 공용 fixture와 cleanup을 정리해 테스트 간섭을 없앤다.

---

## 5. 실행 시 주의점

- UI 수정 금지.
- selector를 맞추기 위해 앱 구조를 바꾸지 않는다.
- `expect.poll`은 저장 전파 확인에만 제한한다.
- SQL은 실제 스키마와 맞는 컬럼만 사용한다.
- 이미 해결된 plan_id, route_logs, audit_logs 오진단은 다시 적지 않는다.

---

## 6. 최종 완료 정의

이 계획이 완료됐다고 보려면 다음이 모두 충족되어야 한다.

- 구독은 canonical `plan_id` 기준으로만 저장/조회된다.
- AI 상담과 비교 흐름은 UI 상태뿐 아니라 DB 기록으로도 확인된다.
- 상조 파트너의 배너, 시뮬레이터, revenue 탭이 같은 plan 기준으로 계산된다.
- `send-monthly-report`는 auth, 실패, 성공, no-op이 분리되어 smoke 검증된다.
- 재조회 후에도 동일 상태가 유지된다.
