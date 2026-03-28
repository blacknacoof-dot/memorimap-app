# Feature Gating 정적 검증 결과

작성일: 2026-03-27

## 1. 검증 범위

- `components/AI/ChatInterface.tsx`
- `components/Consultation/ConsultationView.tsx`
- `components/Consultation/SangjoConsultationModal.tsx`
- `hooks/useQuotaGate.ts`
- `hooks/useFacilityQuota.ts`
- `hooks/useUserPlan.ts`
- `hooks/useFavorites.ts`
- `stores/useSangjoFavoriteStore.ts`
- `components/FacilitySheet/useFacilitySheet.ts`
- `components/MyPageView/useMyPage.ts`
- `components/sangjo/SangjoCompanyList.tsx`
- `components/sangjo/SangjoCompanySheet/index.tsx`
- `components/IntegratedJourneyView.tsx`
- `supabase/migrations/20260227_feature_gating.sql`
- `supabase/migrations/20260310000000_update_sangjo_quota_limits.sql`
- `supabase/migrations/20260327_subscription_cancelling_state.sql`

## 2. 확인된 기준

- Level 1: 정적 코드 검증
- Level 2: SQL Editor RPC 검증
- Level 3: 브라우저 FREE / PREMIUM 실측

## 3. 확인된 최신 동작

- `get_user_plan_info()` 최신 구현은 인증이 없을 때 free-plan 형태의 기본 payload를 반환한다.
- `check_and_increment_user_quota()`와 `decrement_user_favorites_count()`는 인증이 없을 때 예외를 던진다.
- `sangjo_compare` 최신 제한값은 `FREE = 10`, `BASIC = 15`, `PREMIUM = -1` 이다.
- 엔딩노트 레벨은 `components/IntegratedJourneyView.tsx`에서 `userPlan?.limits?.ending_note ?? 'basic'` 기준으로 주입된다.

## 4. 이번 수정으로 보정한 항목

- quota RPC 실패 시 통과되던 경로를 중단 처리로 변경
  - `hooks/useQuotaGate.ts`
  - `hooks/useFacilityQuota.ts`
  - `components/AI/ChatInterface.tsx`
  - `components/Consultation/SangjoConsultationModal.tsx`
  - `components/Consultation/ConsultationView.tsx`
- 무료 플랜 판정 대소문자 의존 완화
  - `hooks/useUserPlan.ts`
  - `components/IntegratedJourneyView.tsx`
- 상조 즐겨찾기 quota 초과 UI 연결
  - `components/sangjo/SangjoCompanyList.tsx`
  - `components/sangjo/SangjoCompanySheet/index.tsx`
- 시설 즐겨찾기 / 마이페이지 제거 경로를 favorite 카운트 체계와 다시 연결
  - `components/FacilitySheet/useFacilitySheet.ts`
  - `components/MyPageView/useMyPage.ts`

## 5. 수정 후에도 남는 구조적 리스크

- AI 상담 quota 차감 원자성
  - `components/AI/ChatInterface.tsx`는 사용자 quota와 시설 quota를 각각 증가 RPC로 호출한다.
  - 둘 중 하나만 성공했을 때의 보정용 facility rollback RPC는 현재 없다.
- 상담 row 생성 실패 시 `ai_consult` 롤백
  - `components/Consultation/ConsultationView.tsx`는 quota 체크 후 `createConsultation()`을 호출한다.
  - 실패 시 `ai_consult`를 되돌리는 RPC는 현재 없다.

## 6. 권장 후속 검증

1. SQL Editor에서 FREE / BASIC / PREMIUM별 `get_user_plan_info()`와 quota RPC 결과 재확인
2. 브라우저에서 FREE 계정으로 AI 상담, 상조 비교, 즐겨찾기 초과 시 업그레이드 유도 확인
3. PREMIUM 계정에서 동일 흐름이 차단 없이 진행되는지 확인
4. 상담 생성 실패를 강제로 유도할 수 있으면 `ai_consult` 잔량 보정 필요 여부를 실측
