# 검증 보고서: high_risk_flow_verification_plan_20260321.md

검증일: 2026-03-21
검증 대상: `docs/high_risk_flow_verification_plan_20260321.md`

---

## 1. 문서 구조 평가

| 항목 | 판정 | 비고 |
|------|------|------|
| 목적/원칙 명확성 | ✅ 양호 | "UI 수정 금지", "데이터 우선", "서버 기준 권한" 원칙 명확 |
| 우선순위 논리 | ✅ 양호 | P0→P3 의존 관계 설명이 타당 (구독→AI→파트너→Edge Function) |
| Step 1~6 실행 순서 | ✅ 양호 | 각 단계별 선행조건/통과기준/다음 조건 구분 명확 |
| 완료 정의 | ✅ 양호 | 5개 기준 구체적 |
| flaky 방지 전략 | ✅ 양호 | 파일별로 구체적 전략 제시 |

---

## 2. 파일 존재성 검증 (19/19 통과)

문서에서 참조한 19개 파일 모두 실제 코드베이스에 존재 확인됨.

| # | 파일 | 핵심 함수/컴포넌트 | 판정 |
|---|------|---------------------|------|
| 1 | `lib/subscriptionPlanIds.ts` | `normalizeSubscriptionPlanId()` | ✅ |
| 2 | `lib/queries.ts` | `updateFacilitySubscription()` (line ~1433) | ✅ |
| 3 | `components/PersonalSubscriptionPlans.tsx` | 개인 요금제 3단계 + portone 결제 | ✅ |
| 4 | `components/SubscriptionPlans.tsx` | 시설 요금제 3단계 (lazy 로드) | ✅ |
| 5 | `stores/useChatStore.ts` | 3개 intent, openChat/closeChat | ✅ |
| 6 | `hooks/useComparison.ts` | compareList/sangjoCompareList | ✅ |
| 7 | `components/Partner/UpgradeBanner.tsx` | DISMISS_KEY, getRecommendation() | ✅ |
| 8 | `components/Partner/CommissionSimulator.tsx` | COMMISSION_KEYS, PLAN_FEES | ✅ |
| 9 | `components/Partner/PartnerRevenueTab.tsx` | CommissionSimulator 포함 | ✅ |
| 10 | `components/Partner/PartnerDashboard.tsx` | 5개 탭, UpgradeBanner | ✅ |
| 11 | `supabase/functions/send-monthly-report/index.ts` | Bearer 검증, RESEND_API_KEY | ✅ |
| 12 | `tests/e2e/db.utils.ts` | service role 기반 DB 접근 | ✅ |
| 13 | `tests/e2e/coreFlows.fixture.ts` | createUser, runInstrumentedStep | ✅ |
| 14 | `components/AI/ChatInterface.tsx` | sendMessageToGemini, QuotaCheckResult | ✅ |
| 15 | `components/Consultation/SangjoConsultationModal.tsx` | PREFERENCE_CHIPS 5종, quotaCheckedRef | ✅ |
| 16 | `components/ComparisonModal.tsx` | 시설 비교 최대 3개, confirmAsync | ✅ |
| 17 | `components/SangjoComparisonModal.tsx` | 상조 비교, ComparisonRow/CompanyCell | ✅ |
| 18 | `components/RecommendationStarter.tsx` | 플로팅 버튼, 3개 intent | ✅ |
| 19 | `components/TopBar.tsx` | SOS 버튼 (onSOS prop, line 66-75) | ✅ |

---

## 3. DB 테이블/컬럼 검증

| 테이블 | 판정 | 확인된 컬럼 | 이슈 |
|--------|------|-------------|------|
| `facility_subscriptions` | ✅ | plan_id, status, next_billing_date, updated_at, facility_id | — |
| `user_subscriptions` | ⚠️ | plan_id, status, ai_consult_by_category, sangjo_compare_used, user_id | **types/db.ts에 인터페이스 미정의** |
| `subscription_plans` | ✅ | id, name_en (7개 플랜 INSERT 확인) | — |
| `subscription_payments` | ✅ | subscription_id, status | — |
| `leads` | ✅ | status, category, urgency | — |
| `consultations` | ✅ | facility_id, user_id, status, created_at | — |
| `sangjo_contracts` | ⚠️ | sangjo_id 확인 | **admin_memo 수동 확인 필요** |
| `sangjo_hq_admins` | ✅ | sangjo_id | — |
| `reservations` | ✅ | facility_id, visit_date | — |
| `system_settings` | ⚠️ | RLS 존재 확인 | **sj_*_commission 값 수동 확인 필요** |
| `ai_consultations` | ✅ | user_id, status | — |

---

## 4. 발견된 이슈

### HIGH — 테스트 작성 전 해결 필수

| # | 이슈 | 영향 | 조치 |
|---|------|------|------|
| H1 | `user_subscriptions` 타입이 `types/db.ts`에 없음 | spec 작성 시 타입 에러 | `types/db.ts`에 `UserSubscription` 인터페이스 추가 |
| H2 | `plan_id` 컬럼이 UUID인지 TEXT인지 스키마 정의 불명확 | 20260320 정규화 마이그레이션 존재하나 원본 타입 모호 | SQL Editor에서 확인 필요 (아래 쿼리 참고) |

### MEDIUM — 테스트 정확도에 영향

| # | 이슈 | 영향 | 조치 |
|---|------|------|------|
| M1 | `system_settings`의 `sj_*_commission` 키/값 구조 미확인 | `CommissionSimulator` 테스트 시 fixture 데이터 설계 불가 | SQL Editor에서 확인 |
| M2 | `sangjo_contracts.admin_memo` 컬럼 실존 미확인 | CLAUDE.md에도 수동 확인 대상으로 남아 있음 | SQL Editor에서 확인 |
| M3 | `system_settings` RLS가 anon SELECT 허용하는지 미확인 | 테스트에서 비인증 조회 시 빈 결과 가능 | SQL Editor에서 확인 |

### LOW — 문서 정확도

| # | 이슈 |
|---|------|
| L1 | 문서 Step 5에서 `20260320_fix_duplicate_facility_and_ai_consult.sql` 참조 — 파일 존재 확인 필요 |
| L2 | `docs/stagewise_plan_master_20260321.md` (Step 1 선행 확인 대상) 존재 확인 필요 |

---

## 5. 수동 확인용 SQL (Supabase SQL Editor 실행)

```sql
-- H2: facility_subscriptions.plan_id 데이터 타입
SELECT data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='facility_subscriptions'
AND column_name='plan_id';

-- M1: system_settings의 sj_*_commission 설정
SELECT * FROM system_settings WHERE key LIKE 'sj_%';

-- M2: sangjo_contracts 스키마
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='sangjo_contracts'
ORDER BY ordinal_position;

-- M3: system_settings RLS 정책
SELECT policyname, cmd, qual FROM pg_policies
WHERE tablename='system_settings';

-- 추가: user_subscriptions 전체 컬럼
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='user_subscriptions'
ORDER BY ordinal_position;
```

---

## 6. 종합 판정

| 평가 항목 | 점수 |
|-----------|------|
| 계획 논리성 | ★★★★★ |
| 코드베이스 정합성 | ★★★★☆ (DB 타입 2건 미비) |
| 실행 가능성 | ★★★★☆ (SQL Editor 수동 확인 3건 선행 필요) |
| flaky 방지 설계 | ★★★★★ |
| 완료 기준 명확성 | ★★★★★ |

---

## 7. 권장 다음 단계

### 즉시 실행 (테스트 작성 전)
1. SQL Editor에서 H2, M1, M2, M3 수동 확인 → 결과를 이 문서에 반영
2. `types/db.ts`에 `UserSubscription` 인터페이스 추가 (H1)

### 그 다음
1. 각 spec 파일 초안 템플릿 생성 (fixture + describe 구조만)
2. Step 2(구독 정합성)부터 순서대로 구현
