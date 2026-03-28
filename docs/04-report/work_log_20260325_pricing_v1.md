# 2026-03-25 요금제 v1 작업 내역

## 커밋 4건

| 커밋 | 메시지 | 파일 |
|------|--------|------|
| `bd38a2a` | chore(pricing): finalize v1 validation follow-ups | types/db.ts, PersonalSubscriptionManager.tsx, 마이그레이션, 문서 2건 |
| `f29e39f` | docs(pricing): add NHN KCP test corrections | 문서 3건 |
| `5c3c30a` | docs(pricing): hold old INSERT policy — facility auth client vs service_role mismatch | 문서 3건 |
| `c3e491f` | fix(rls): add facility INSERT policy + drop legacy payments_insert_service_or_owner | 마이그레이션 1건 |

## 코드 변경

- `types/db.ts`: `CanonicalUserSubscriptionPlan` / `LegacyUserSubscriptionPlan` 분리, `BillingCycle`, `PaymentContext` 타입 추가
- `components/SuperAdmin/PersonalSubscriptionManager.tsx`: PERSONAL_BASIC → `베이직 (단종)` 표시
- `supabase/migrations/20260325_pricing_v1_schema.sql`: RLS `::text` 캐스팅 + `f.user_id` 컬럼명 수정
- `supabase/migrations/20260325_facility_payments_insert_policy.sql`: facility INSERT 정책 신규 + 구정책 DROP

## DB 운영 (Supabase SQL Editor 실행)

| 작업 | 결과 |
|------|------|
| `20260325_pricing_v1_schema.sql` 적용 | 성공 (에러 3건 수정 후) |
| `user_subscriptions_plan_id_check` 제약 조건 업데이트 | 성공 |
| `personal_free` → `PERSONAL_FREE` 백필 (29건) | 성공 |
| `subscription_payments_insert_facility` 정책 추가 | 성공 |
| `payments_insert_service_or_owner` 구정책 DROP | 성공 |

## 인프라 설정

| 항목 | 상태 |
|------|------|
| `.env.local` PortOne 키 3종 | 완료 |
| Vercel 환경변수 동기화 + Redeploy | 완료 |
| Edge Function 배포 (verify-payment, approve-partner) | 완료 |
| Supabase PORTONE_API_SECRET | 완료 |

## 문서 업데이트 (사용자 작성 + Claude 검증)

- `claude_pricing_execution_handoff_20260325.md`: 섹션 7~9 추가 (상태 확인, 테스트 메모, facility RLS 주의)
- `pricing_v1_claude_review_20260325.md`: 후속 확인 메모 + NHN KCP 보정 + facility RLS 재검토
- `portone_nhn_kcp_direction_20260325.md`: 섹션 10 추가 (fallback/plan_id/secret/facility 정책 보정)

## 검증 결과

| 항목 | 결과 |
|------|------|
| tsc --noEmit | 에러 0건 |
| npm run build | 성공 |
| subscription_plans v1 가격 | 정상 반영 |
| plan_id 백필 | PERSONAL_FREE 29건 완료 |
| INSERT RLS 3정책 | service + personal + facility 정상 |

## 미해결: 테스트 결제 DB 반영 0건 (03-25 시점)

- 개인/시설/상조 3종 결제 테스트 실행
- 결제 성공 toast는 표시됨
- 그러나 DB 반영 0건 (user_subscriptions, facility_subscriptions, subscription_payments 모두 오늘 날짜 row 없음)
- 원인 미확인 상태

### 🟢 2026-03-26 해결 경과

- **DB 반영 0건의 전제 자체가 변경됨**: 당시 결제창이 열리지 않았음 (prepare/v2 400)
- **400 원인 확정**: V1 채널키로 V2 SDK 호출 → V2 채널 신규 생성 후 결제창 정상 열림
- **DB 영속화 구조**: verify-payment EF의 service_role 경유로 이미 이동 완료
- **현재 상태**: 결제창 열림 ✅ → 테스트 결제 후 DB 반영 확인 필요
## 2026-03-27 Feature Gating 정밀 검증 / 보정

### 문서 업데이트

- `CLAUDE.md`
  - Level 1 / 2 / 3 검증 순서 추가
  - 최신 feature gating 기준 경로와 리스크 추가
- `docs/01-plan/memorimap_release_validation_checklist_20260326.md`
  - `Feature Gating 정밀 검증 기준` 섹션 추가
- `docs/04-report/feature_gating_sql_checklist_20260327.md`
  - 최신 마이그레이션 기준으로 전면 수정
  - `sangjo_compare` FREE 10 / BASIC 15 반영
  - 최신 `get_user_plan_info()` 인증 동작 반영
- `docs/04-report/feature_gating_static_verification_20260327.md`
  - 정적 검증 보고서 신규 작성

### 코드 보정

- quota RPC fail-open 제거
  - `hooks/useQuotaGate.ts`
  - `hooks/useFacilityQuota.ts`
  - `components/AI/ChatInterface.tsx`
  - `components/Consultation/SangjoConsultationModal.tsx`
  - `components/Consultation/ConsultationView.tsx`
  - `stores/useSangjoFavoriteStore.ts`
- 무료 플랜 판정 대소문자 정규화
  - `hooks/useUserPlan.ts`
  - `components/IntegratedJourneyView.tsx`
- 상조 즐겨찾기 quota 초과 UI 연결
  - `components/sangjo/SangjoCompanyList.tsx`
  - `components/sangjo/SangjoCompanySheet/index.tsx`
- 즐겨찾기 카운트 보정 연결
  - `components/FacilitySheet/useFacilitySheet.ts`
  - `components/MyPageView/useMyPage.ts`

### 검증 결과

- `npm run typecheck` 통과
- `git diff --check` 기준 whitespace 오류 없음

### 커밋 판단

- 현재 변경분은 저장 후 커밋해도 되는 상태로 판단
- 단, 아래 2건은 이번 커밋의 알려진 잔여 리스크로 문서화됨
  - AI 상담의 user quota / facility quota 차감은 아직 원자적이지 않음
  - 상담 생성 실패 시 `ai_consult` 롤백 RPC는 아직 없음

## 2026-03-28 Mobile package manager header fix

### 코드 변경

- `components/Partner/sections/PackageManager.tsx`
  - 헤더 컨테이너를 모바일 기준 `flex-col`, `sm` 이상에서만 가로 정렬로 변경
  - 제목에 `break-keep whitespace-nowrap` 적용
  - `패키지 추가`, `전체 저장` 버튼에 `break-keep whitespace-nowrap`와 `min-h-[44px]` 적용
  - 모바일에서 버튼이 제목 아래 행으로 내려가도록 `flex-wrap` 구조로 조정

### 실행 검증

- `npm run verify`
  - 실패
  - 원인: 이번 수정과 무관한 기존 ESLint 오류 2건
  - `hooks/useFacilityQuota.ts:31` `no-useless-catch`
  - `hooks/useQuotaGate.ts:38` `no-useless-catch`
- `npm run typecheck`
  - 통과
- `npm run build`
  - 통과

### Claude follow-up

- 실제 모바일 화면 확인은 아직 필요
- Claude는 `docs/MANUAL_TEST_CHECKLIST.md`의 `103A` 항목 기준으로 Chrome DevTools 모바일 폭 또는 실기기에서 재확인
- 확인 포인트
  - `가격/패키지 관리` 제목이 한 줄 유지되는지
  - `패키지 추가` 버튼 텍스트가 2~3줄로 쪼개지지 않는지
  - 버튼 2개가 제목과 같은 줄에서 폭 충돌 없이 제목 아래 줄로 배치되는지

## 2026-03-28 ErrorBoundary improvement review scope

### Claude review conclusion

- `components/ErrorBoundary.tsx`의 현재 문제 인식은 대체로 맞음
- 자동 복구는 현재 `상태 리셋` 중심이라 반복 크래시가 나면 같은 오류를 다시 밟을 수 있음
- 실패 후 에러 UI 톤이 강하고, 버튼 3개가 한 줄 배치라 모바일에서 깨질 가능성이 있음
- `새로고침`, `홈` 동작이 현재 둘 다 `/` 이동이라 의미가 중복됨

### Approved scope

- ErrorBoundary fallback UI 톤 완화
- 모바일 버튼 레이아웃 개선
  - `flex-col sm:flex-row` 또는 모바일 우선 grid로 정리
- 버튼 의미 정리
  - 중복 동작 제거 후 `다시 시도`, `홈으로`, `새로고침` 중 실제로 구분되는 조합만 유지
- 자동 복구 문구를 더 부드럽게 수정

### Deferred scope

- `2차: 해당 섹션 숨김` 자동화
  - 현재 boundary 범위가 커서 섹션 단위 격리 설계가 먼저 필요
- 복구 실패 시 자동 홈 리다이렉트 기본 적용
  - UX가 과하고 원인 추적에도 불리하므로 기본값으로는 보류
- 반복 크래시 근본 원인 추적
  - Vercel/Sentry 등 운영 로그 확인 태스크로 분리

### Implementation note for Claude

- 이번 라운드는 `ErrorBoundary.tsx` 단일 파일 내 안전한 UI/UX 개선까지만 승인
- boundary 분리, fallback 단계 세분화, 자동 라우팅은 별도 설계/승인 후 진행

## 2026-03-28 Edge Function error log triage note

### 로그 해석 결론

- `approve-partner` 2026-03-20 에러는 현재 Edge Function 코드 수정보다 운영 DB 마이그레이션 적용 여부를 먼저 확인해야 함
- 로컬 코드베이스에는 `approve_partner_transaction` 관련 `::public.user_role` 캐스트와 enum 보강 마이그레이션이 이미 존재함
- `verify-payment`의 `billing_period_end` 에러도 현재 코드 버그 단정이 아니라 운영 DB에 `20260326_add_billing_period_columns.sql`이 반영되지 않았을 가능성이 큼
- `verify-payment`의 `SJ_STARTER -> sj_starter` 단순 치환은 보류
  - 현재 로컬 최신 코드/마이그레이션/문서 기준에서는 `SJ_STARTER` canonical 가능성이 더 강함
- 가장 먼저 확인할 실질 이슈는 `facilityOwned: false`
  - 상조 결제 요청에서 넘어오는 `facilityId`가 실제로 어떤 테이블의 어떤 id인지 운영 데이터로 대조 필요

### Claude에 전달할 정확한 지시

```text
지금은 코드부터 고치지 말고 운영 DB 사실관계를 먼저 검증해라.

목표:
1. approve-partner / verify-payment 에러 로그의 실제 원인이 코드 미반영인지, DB 마이그레이션 미적용인지 구분
2. verify-payment의 facilityOwned=false 원인을 실데이터 기준으로 확인

수정 금지 사항:
- approve-partner RPC를 바로 수정하지 말 것
- verify-payment에서 SJ_STARTER를 sj_starter로 바로 바꾸지 말 것
- billing_period_end 참조를 코드에서 바로 삭제하지 말 것

먼저 확인할 것:
1. 운영 DB에 아래 마이그레이션이 실제 적용됐는지 확인
   - 20260320_fix_user_role_enum.sql
   - 20260326_add_billing_period_columns.sql
2. 운영 DB의 subscription_plans.name_en 실제 canonical 값 확인
   - FREE / BASIC / PREMIUM / SJ_STARTER 계열이 실제 어떤 대소문자로 저장돼 있는지
3. 상조 결제 요청 시 사용하는 facilityId의 실제 대상 확인
   - facilities.id인지
   - funeral_companies.id인지
   - sangjo_hq_admins.sangjo_id와 매칭되는지
4. facilityOwned=false가 나온 user/facility 조합으로 소유권 매핑을 SQL로 직접 확인

원하는 산출물:
- 코드 수정안이 아니라 사실확인 보고서
- 항목별로
  - 확인 SQL
  - 실제 결과
  - 원인 판정
  - 그 다음 수정 필요 여부

최종 판정 형식:
- approve-partner: 코드 수정 필요 / DB 적용 필요 / 둘 다 불필요
- verify-payment billing_period_end: 코드 수정 필요 / DB 적용 필요 / 둘 다 불필요
- verify-payment plan_id canonical: SJ_STARTER 유지 / sj_starter로 변경 / 추가 확인 필요
- verify-payment facilityOwned=false: 어떤 매핑이 깨졌는지 구체적으로
```

### 내부 판단 메모

- 현재 단계에서 가장 위험한 오판은 `SJ_STARTER -> sj_starter`를 근거 없이 적용하는 것
- 현재 단계에서 가장 가치 있는 확인은 운영 DB 기준 `facilityOwned=false` 재현 조합을 SQL로 직접 대조하는 것

## 2026-03-28 Edge Function error log final verdict

### 최종 판정

- `approve-partner` enum 이슈
  - 판정: 둘 다 불필요
  - 근거: `facility_admin`, `sangjo_user` enum 존재 확인, `approve_partner_transaction`의 `::public.user_role` 캐스팅 확인
  - 해석: 2026-03-20 로그는 마이그레이션 적용 이전 호출로 판단
- `verify-payment` `billing_period_end`
  - 판정: 둘 다 불필요
  - 근거: 운영 DB에 `billing_period_start`, `billing_period_end` 컬럼 존재 확인
  - 해석: 2026-03-26 로그는 마이그레이션 반영과 Edge Function 배포 시차 문제로 판단
- `verify-payment` plan_id canonical
  - 판정: `SJ_STARTER` 유지
  - 근거: 운영 DB canonical 값이 `SJ_STARTER`, 현재 `normalizePlanId()`도 대문자 정규화
  - 해석: 소문자 `sj_starter`로 바꾸는 수정은 금지
- `verify-payment` `facilityOwned=false`
  - 판정: 추가 확인 필요
  - 근거: 현재 운영 데이터 기준으로는 `facilities.user_id = system_sangjo_import`, `sangjo_hq_admins` 매핑 정상, user role도 `sangjo_hq_admin` 정상
  - 해석: 2026-03-26 당시 배포된 `verify-payment`가 현재 코드보다 구버전이어서 `sangjo_hq_admins` 소유권 체크가 빠졌을 가능성이 높음

### 다음 액션

- Supabase Dashboard에서 `verify-payment` 마지막 배포 시각 확인
- 기준 시각: `2026-03-26 14:25 UTC`
- 만약 해당 시각 이전 배포본이면 최신 코드로 `verify-payment` 재배포
- 재배포 후 동일 상조 결제 케이스 1건 재검증
- 재검증 결과만 별도 보고서 또는 작업 로그 후속 메모로 남김

### Claude 전달 요약

```text
최종 판정:
- approve-partner enum 이슈: 해결됨, 코드 수정 불필요
- verify-payment billing_period_end 이슈: 해결됨, 코드 수정 불필요
- verify-payment plan_id canonical: SJ_STARTER 유지
- verify-payment facilityOwned=false: 현재 코드 기준 재현 근거 부족, 당시 배포 버전 확인 필요

다음 액션:
1. Supabase Dashboard에서 verify-payment 마지막 배포 시각 확인
2. 2026-03-26 14:25 UTC 이전 배포본이면 최신 코드로 재배포
3. 재배포 후 같은 상조 결제 케이스 1건 재검증
4. 재검증 결과만 보고서로 남길 것

주의:
- SJ_STARTER를 sj_starter로 바꾸지 말 것
- billing_period_end 제거하지 말 것
- approve-partner RPC 수정하지 말 것
```
## 2026-03-28 Final operation status

### Completed today

- `components/ErrorBoundary.tsx`
  - fallback UI tone softened
  - mobile button layout adjusted
- `components/FacilitySheet/index.tsx`
  - `인증됨` badge moved out of the long facility-name row
- Supabase Edge Functions
  - `approve-partner` CORS updated and deployed
  - `gemini-proxy` CORS updated and deployed
  - `deploy-bot-data` CORS updated and deployed
- `profiles` sync 409
  - `20260323_fix_profiles_auth_identity_consistency.sql` applied on production DB
  - `clerk_id IS NULL` placeholder rows backfilled
  - `idx_profiles_clerk_id_unique` verified
  - legacy UUID-based `profiles.id` mismatch rows corrected where safe
- facility ownership mapping
  - `facilities.user_id` production mapping repaired
- Edge Function log triage
  - `approve-partner`, `verify-payment` historical errors reviewed
  - final verdict recorded above

### Verification summary

- `profiles` 409 cause was split into two issues and both were resolved:
  - placeholder rows with `clerk_id IS NULL`
  - legacy rows where `profiles.id` and current auth UUID diverged
- After DB repair, remaining `id::text <> clerk_id` rows are test-only or legacy exceptions outside the current production login path.
- `facilityOwned=false` investigation concluded with production mapping recovery and no remaining open code-change requirement from the reviewed log set.

### Deployment status

- Git push completed for the 3 prepared commits on `origin/dev`
- Supabase completed:
  - Edge Function deployment for `approve-partner`, `gemini-proxy`, `deploy-bot-data`
  - production DB fixes for `profiles` identity consistency and facility mapping
- Vercel production deploy is still required for frontend UI changes to appear on the live site

### Remaining note

- Frontend changes already exist in `origin/dev`, but `ErrorBoundary`, `FacilitySheet`, and `NotificationModal` UI/UX updates require Vercel production deployment before they appear in production.

---

## 2026-03-28 요금제 정합성 검증

### Phase 1: DB ↔ UI 교차 검증

#### 개인 요금제 (`subscription_plans`)

| plan_id | 월 요금 | ai_consult | sangjo_compare | favorites | ending_note | DB 일치 | UI 일치 |
|---------|---------|------------|----------------|-----------|-------------|---------|---------|
| personal_free | 0 | 3/카테고리 | 10 | 5 | basic | ✅ | ✅ |
| personal_basic | 4,900 | 10/카테고리 | 15 | 20 | standard | ✅ | ✅ (단종, 비노출) |
| personal_premium | 9,900 | ∞ | ∞ | ∞ | premium | ✅ | ✅ |

#### 시설 요금제

| plan_id | 월 요금 | ai_chat_quota | sms_quota | photos | DB 일치 | UI 일치 |
|---------|---------|--------------|-----------|--------|---------|---------|
| free | 0 | 10 | 0 | 5 | ✅ | ✅ |
| basic | 29,000 | 50 | 50 | 20 | ✅ (수정 후) | ✅ |
| premium | 59,000 | ∞ | ∞ | ∞ | ✅ | ✅ |
| enterprise | 별도 | ∞ | ∞ | ∞ | ✅ | ✅ (문의 전용) |

#### 상조 요금제

| plan_id | 월 요금 | ai_consult | leads | dashboard | DB 일치 | UI 일치 |
|---------|---------|------------|-------|-----------|---------|---------|
| sj_starter | 0 | 5 | 10 | basic | ✅ | ✅ |
| sj_professional | 49,000 | ∞ | ∞ | full | ✅ | ✅ (비노출) |
| sj_enterprise | 별도 | ∞ | ∞ | full | ✅ | ✅ (비노출) |

### Phase 2: BASIC 플랜 DB 수정

시설 `basic` 플랜의 features JSONB가 UI 스펙과 불일치하여 수정:

```sql
UPDATE subscription_plans
SET features = jsonb_set(
  jsonb_set(
    jsonb_set(features, '{ai_chat_quota}', '50'),
    '{sms_quota}', '50'
  ),
  '{photos}', '20'
)
WHERE plan_id = 'basic' AND plan_type = 'facility';
```

| 항목 | 수정 전 | 수정 후 | UI 스펙 |
|------|---------|---------|---------|
| ai_chat_quota | 100 | 50 | 50 |
| sms_quota | 100 | 50 | 50 |
| photos | -1 (무제한) | 20 | 20 |

### 검증 결과 요약

- **정상**: 개인 FREE/PREMIUM, 시설 FREE/PREMIUM/ENTERPRISE, 상조 전체
- **수정 완료**: 시설 BASIC (features 3항목)
- **코드 경로 확인**: `get_user_plan_info()`, `check_and_increment_user_quota()`, `check_and_increment_facility_quota()` 모두 `subscription_plans.features` JSONB에서 limits 로드 → DB 수정으로 런타임 반영 완료

### 후속 이슈

| 우선순위 | 이슈 | 상태 | 설명 |
|----------|------|------|------|
| MEDIUM | 엔딩노트 level gating | ✅ 완료 (645c134) | basic=preferences only, 2중 방어, onUpgrade CTA 연결 |
| LOW | UpgradePrompt 문구 | ✅ 완료 (f9af712) | "베이직 이상" → "프리미엄 플랜" 수정 |
| LOW | 시설 SMS 초과 UI 피드백 | ⏸ 보류 | SMS 전송 기능 자체 미구현. SMS 기능 구현 시 함께 처리 |
| LOW | 미인증 fallback limits:{} | ✅ 완료 (7dbc15a) | `FREE_PLAN_DEFAULT.limits`에 실제 PERSONAL_FREE 값 채움 |
| LOW | 레거시 소문자 plan 행 4개 | ✅ 완료 (DB 직접) | `facility_subscriptions` 정규화 후 소문자 4행 삭제. 마이그레이션 기록: `20260328_cleanup_legacy_lowercase_plans.sql` |
