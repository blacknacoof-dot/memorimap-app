# 2026-03-22 정밀 검증 결과 보고서

> 검증 대상: 2026-03-21 작업 전체 (deep_analysis, precision_targets, high_risk_flow_plan 기준)
> 검증 수행: 2026-03-22 Opus 4.6 코드베이스 실측 기반

---

## 1. 검증 범위

2026-03-21 심층 정리 문서에서 정의한 5개 축을 코드베이스와 1:1 대조 검증했다.

| 축 | 검증 항목 수 | 결과 |
|----|-------------|------|
| E2E 고위험 플로우 | 7 spec + 3 helper | ✅ 전수 통과 |
| Edge Function | 2 파일 | ✅ 전수 통과 |
| DB 마이그레이션/RPC | 7 파일 | ✅ 전수 통과 |
| 요금제 맵핑 | 1 파일 | ✅ 통과 |
| 서비스 레이어 | 3 파일 | ⚠️ 2통과 + 1조건부 통과 |

---

## 2. E2E 고위험 플로우 검증

### 2-1. 파일별 실측 결과

| 파일 | 존재 | serial | UUID | 테스트 수 | 줄 수 | 상태 |
|------|------|--------|------|----------|-------|------|
| reservation.payment.spec.ts | ✅ | ✅ L12 | ✅ L9 `crypto.randomUUID()` | 6 | 147 | PASS |
| partner.approval.spec.ts | ✅ | ✅ L65 | — | 8 | 253 | PASS |
| subscription.flow.spec.ts | ✅ | ✅ | — | 2 | 302 | PASS |
| ai.compare.spec.ts | ✅ | ✅ | — | 3 | 135 | PASS |
| partner.revenue.spec.ts | ✅ | ✅ | — | 2 | 296 | PASS |
| report.smoke.spec.ts | ✅ | ✅ | — | 3 | 226 | PASS |
| qa.execution.spec.ts | ✅ | ✅ | — | 4 | 137 | PASS |

**합계**: 28 tests (고위험 7파일), 전부 active (skip 없음)

### 2-2. 지원 파일

| 파일 | 존재 | 줄 수 | 용도 |
|------|------|-------|------|
| highRisk.helpers.ts | ✅ | 138 | createHighRiskUser, createFacilityFixture, deleteHighRiskUser |
| db.utils.ts | ✅ | 114 | service role DB 접근, 테스트 상수 |
| coreFlows.fixture.ts | ✅ | 240 | setupCoreFlowFixture, teardownCoreFlowFixture, loginViaUi |

### 2-3. Skipped 3건 출처 (일일 보고서 49 total 기준)

| 파일 | skip 수 | 사유 | 위험도 |
|------|---------|------|--------|
| review-delete.spec.ts | 1 | `test.describe.skip` — @manual @quarantine (수동 검증 전용) | LOW |
| superAdmin.joinChat.spec.ts | 2 | `test.describe.skip` — @quarantine (격리 대상) | LOW |

**결론**: 3건 모두 의도적 격리. 고위험 플로우와 무관. `46 passed / 0 failed / 3 skipped` 수치 정확.

---

## 3. Edge Function 검증

### send-monthly-report/index.ts (25줄)
- ✅ Bearer token을 core.ts로 전달
- ✅ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY 환경변수 로드
- ✅ env 미설정 시 early return
- ✅ 비즈니스 로직 없음 (진입점만)

### send-monthly-report/core.ts (295줄)
- ✅ 300줄 이하 (295줄)
- ✅ Bearer token ↔ serviceRoleKey 엄격 비교 (L46-49)
- ✅ HTML 이메일 템플릿 (`buildEmailHtml`, L243-295)
- ✅ `any` 타입 0건
- ✅ Sangjo 플랜 필터: `in('plan_id', ['SJ_STARTER', 'SJ_PROFESSIONAL', 'SJ_ENTERPRISE'])`
- ✅ dryRun 모드 지원
- ✅ 전환율 계산, 업그레이드 힌트 분기

**export**: `handleSendMonthlyReportRequest`, `PartnerReport`, `MonthlyReportOptions`

---

## 4. DB 마이그레이션 / RPC 검증

| 파일 | 존재 | 핵심 내용 | `::public.user_role` | 이슈 |
|------|------|----------|---------------------|------|
| 20260215_fix_approve_partner_e2e.sql | ✅ | approve_partner_transaction RPC 정의 | ✅ L92 | — |
| 20260223_high_severity_fixes.sql | ✅ | FK 복원 (favorites, facility_subscriptions, facility_images), TEXT→UUID 변환 | ✅ | — |
| 20260226_partner_rpc_atomic.sql | ✅ | FOR UPDATE 락, 중복 승인 방지 (L85-88), alert INSERT | ✅ | — |
| 20260301_sangjo_facilities_sync.sql | ✅ | funeral_companies→facilities 동기화, v_facility_id 기준 통일 | ✅ | — |
| 20260320_assign_freedlife_sangjo_admin.sql | ✅ | 프리드라이프 관리자 배정, role trigger 비활성화/재활성화 | — | — |
| 20260320_backfill_facility_subscription_plan_ids.sql | ✅ | plan_id 정규화 (sjstarter, 상조_starter → sj_starter 등) | — | — |
| 20260320_fix_duplicate_facility_and_ai_consult.sql | ✅ | 중복 시설 정리, RPC 중복 방지 (SELECT LIMIT 1), ai_consultations RLS | — | — |

**결론**: 7개 마이그레이션 전수 존재, 핵심 로직 일치. `::public.user_role` 캐스트 확인 완료.

---

## 5. 요금제 맵핑 검증

### lib/subscriptionPlanIds.ts (33줄)

**한글 맵핑 확인:**
| 한글 | canonical key | 확인 |
|------|-------------|------|
| 무료체험 | free | ✅ |
| 베이직 | basic | ✅ |
| 프리미엄 | premium | ✅ |
| 엔터프라이즈 | enterprise | ✅ |

**추가 맵핑:**
- 개인: personal_free, personal_basic, personal_premium → canonical
- 상조: sj_starter, sj_professional, sj_enterprise + 변형 (sjstarter, 상조_starter 등)

**정규화 전략**: `.trim().toLowerCase().replace(/[\s-]+/g, '_')` → PLAN_ID_ALIASES 조회 → 없으면 원본 반환

---

## 6. 서비스 레이어 검증

| 파일 | 줄 수 | client 주입 | CRUD | any 타입 | 300줄 규칙 | 상태 |
|------|-------|------------|------|---------|-----------|------|
| favoriteService.ts | 82 | ✅ 전 함수 | ✅ C/R/D | 0건 | ✅ | PASS |
| sangjoFavoriteService.ts | 69 | ✅ 전 함수 | ✅ C/R/D | 0건 | ✅ | PASS |
| geminiService.ts | 539 | — (mock) | — | 0건 | ❌ 초과 | 조건부 |

### geminiService.ts 상세 (539줄, 300줄 규칙 위반)

**현재 구조**: mock/simulation 기반 AI 서비스. 다수 시나리오와 추천 로직이 단일 파일에 포함.
**위반 수준**: MVP 단계에서 허용 가능, P2 리팩토링 대상.
**분리 제안**:
- `geminiPrompts.ts` — 시나리오 템플릿
- `geminiScoring.ts` — 추천/스코어링 로직
- `geminiService.ts` — 메인 핸들러 (100줄 이하)

---

## 7. 문서 참조 검증 (이슈 L1, L2)

| 이슈 | 대상 | 결과 |
|------|------|------|
| L1 | `20260320_fix_duplicate_facility_and_ai_consult.sql` | ✅ 존재 |
| L2 | `docs/stagewise_plan_master_20260321.md` | ✅ 존재 |

---

## 8. 미해결 이슈 (verification_report에서 계승)

### HIGH — 코드 작업 필요

| ID | 이슈 | 현재 상태 | 조치 |
|----|------|----------|------|
| H1 | `UserSubscription` 인터페이스가 types/db.ts에 없음 | ❌ 미해결 | types/db.ts에 추가 필요 |
| H2 | facility_subscriptions.plan_id 데이터 타입 (UUID vs TEXT) | ❓ SQL Editor 수동 확인 필요 | 아래 쿼리 실행 |

### MEDIUM — DB 수동 확인 필요

| ID | 이슈 | 조치 |
|----|------|------|
| M1 | system_settings의 sj_*_commission 키/값 구조 | SQL Editor 확인 |
| M2 | sangjo_contracts.admin_memo 컬럼 실존 | SQL Editor 확인 |
| M3 | system_settings RLS가 anon SELECT 허용하는지 | SQL Editor 확인 |

### SQL Editor 수동 확인 결과 (2026-03-22 실행)

| ID | 결과 | 상세 |
|----|------|------|
| H2 | ✅ 해결 | `facility_subscriptions.plan_id` = TEXT, nullable. types/db.ts `plan_id?: string` 정확 |
| M1 | ⚠️ 미등록 | `system_settings`에 `sj_%` 키 0건. 수수료 설정이 DB에 없음 → CommissionSimulator가 하드코딩 fallback 사용 중인지 확인 필요 |
| M2 | ✅ 해결 | `sangjo_contracts.admin_memo` 존재 (text, nullable). 전체 20개 컬럼 확인 |
| M3 | ⚠️ 제한적 | SELECT는 `is_super_admin()`만 허용. anon/일반유저 조회 불가 → 파트너가 수수료율 조회 시 빈 결과 가능 |

**M1 + M3 연관 이슈**: CommissionSimulator가 system_settings에서 수수료율을 읽는 구조라면, (1) 데이터가 없고 (2) 파트너 권한으로 조회도 불가. 코드 내 fallback 또는 하드코딩 여부 확인 필요.

---

## 9. 종합 판정

| 평가 항목 | 결과 |
|-----------|------|
| E2E 테스트 정합성 | ✅ 49 tests, 46/0/3 수치 정확, skipped 사유 확인 |
| Edge Function 구조 | ✅ 진입점/핵심 분리, 인증 엄격, 300줄 준수 |
| DB 마이그레이션 | ✅ 7개 전수 존재, role cast/중복방지/동기화 확인 |
| 요금제 맵핑 | ✅ 한글↔canonical 맵핑 완전, 정규화 전략 명확 |
| 서비스 레이어 | ⚠️ 2/3 완전 통과, geminiService 300줄 초과 (P2) |
| DB 타입/스키마 | ✅ H1 해결, H2/M2 확인 완료 |
| system_settings | ⚠️ 수수료 미등록(M1) + RLS 제한(M3) — 파트너 수수료 조회 경로 점검 필요 |
| 문서 참조 | ✅ 참조 파일 전수 존재 |

### 최종 결론

2026-03-21 작업의 코드 산출물은 문서에 기술된 내용과 **실제 코드베이스가 일치**한다.
심층 정리 문서의 5개 축 분류, 검증 기준, 해석 가이드는 모두 코드 실측으로 뒷받침된다.

**해결 완료:**
- ✅ H1: UserSubscription 인터페이스 추가 (커밋 `5af0ffd`)
- ✅ H2: plan_id = TEXT 확인
- ✅ M2: admin_memo 컬럼 존재 확인

**남은 조치:**
1. M1+M3: CommissionSimulator의 수수료율 조회 경로 점검 (하드코딩 fallback 확인 또는 sj_*_commission 데이터 INSERT)
2. geminiService.ts 300줄 초과 해결 (P2)
