-- ============================================================
-- 20260223_hotfix_missing_columns_and_policies.sql
-- C-1: reservations 누락 컬럼 추가 (payment_verified, payment_id)
-- C-2: consultations 누락 정책 재생성 + 20260205 구 정책 정리
-- ============================================================

BEGIN;

-- ============================================================
-- C-1: reservations 테이블 누락 컬럼 추가
-- verify-payment Edge Function이 UPDATE하는 컬럼 2개 미생성 상태
-- (payment_amount, paid_at는 critical_fixes.sql에서 이미 추가됨)
-- ============================================================

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- payment_verified 인덱스 (결제 완료 예약 조회 성능)
CREATE INDEX IF NOT EXISTS idx_reservations_payment_verified
  ON public.reservations(payment_verified)
  WHERE payment_verified = true;

-- ============================================================
-- C-2: consultations 정책 복원
-- 20260223_critical_fixes.sql HIGH-3에서 과다 삭제된 2건 재생성
-- + 20260205 구 정책 3건 정리 (auth.uid() 직접 참조 → clerk_user_id() 불일치)
-- ============================================================

-- 2-A: 20260205 구 정책 정리 (존재하면 삭제)
DROP POLICY IF EXISTS "authenticated_insert_own_consultation" ON public.consultations;
DROP POLICY IF EXISTS "authenticated_select_own_consultation" ON public.consultations;
DROP POLICY IF EXISTS "facility_admin_view_consultations" ON public.consultations;
DROP POLICY IF EXISTS "consultations_insert_public" ON public.consultations;
DROP POLICY IF EXISTS "consultations_owner_all" ON public.consultations;

-- 2-B: 시설관리자 상담 조회 정책 재생성
-- (20260221에서 생성 → 20260223_critical_fixes에서 삭제됨)
DROP POLICY IF EXISTS "consultations_facility_admin_select" ON public.consultations;

CREATE POLICY "consultations_facility_admin_select"
  ON public.consultations FOR SELECT
  TO authenticated
  USING (
    facility_id IN (
      SELECT id::text FROM public.facilities
      WHERE user_id = public.clerk_user_id()
    )
  );

-- 2-C: 슈퍼관리자 전체 접근 정책 재생성
-- (20260221에서 생성 → 20260223_critical_fixes에서 삭제됨)
DROP POLICY IF EXISTS "consultations_super_admin_all" ON public.consultations;

CREATE POLICY "consultations_super_admin_all"
  ON public.consultations FOR ALL
  TO authenticated
  USING (public.is_super_admin());

COMMIT;
