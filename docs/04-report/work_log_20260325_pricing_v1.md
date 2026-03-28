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
