-- =============================================
-- 20260221_db_fixes_batch1.sql
-- DB 감사 결과 수정 (ISSUE-9, 12, 15, 18, 29)
-- =============================================

-- =============================================
-- ISSUE-12: is_super_admin() 함수 통일
-- admin_users 테이블 기준, clerk_user_id() 사용
-- =============================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = public.clerk_user_id()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================
-- ISSUE-9: rls_test 테스트 테이블 삭제
-- =============================================
DROP TABLE IF EXISTS public.rls_test CASCADE;

-- =============================================
-- ISSUE-29: reservations 테이블 결제 검증 컬럼 추가
-- verify-payment Edge Function에서 사용
-- =============================================
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- payment_id 인덱스 (결제 조회용)
CREATE INDEX IF NOT EXISTS idx_reservations_payment_id
  ON public.reservations(payment_id)
  WHERE payment_id IS NOT NULL;

-- =============================================
-- ISSUE-18: 누락 인덱스 일괄 추가
-- 자주 쿼리되는 FK/조회 컬럼
-- =============================================
CREATE INDEX IF NOT EXISTS idx_reservations_facility_id
  ON public.reservations(facility_id);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id
  ON public.reservations(user_id);

CREATE INDEX IF NOT EXISTS idx_consultations_facility_id
  ON public.consultations(facility_id);

CREATE INDEX IF NOT EXISTS idx_consultations_user_id
  ON public.consultations(user_id);

CREATE INDEX IF NOT EXISTS idx_leads_facility_id
  ON public.leads(facility_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id
  ON public.user_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_consultations_user_id
  ON public.ai_consultations(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_consultations_facility_id
  ON public.ai_consultations(facility_id);

-- =============================================
-- ISSUE-15: subscription_payments RLS 수정
-- 기존 과도하게 개방된 SELECT 정책 제거 + 제한적 정책 생성
-- =============================================

-- 1) 기존 과도한 정책 삭제 (이름 패턴별 시도)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.subscription_payments;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.subscription_payments;
DROP POLICY IF EXISTS "subscription_payments_select_policy" ON public.subscription_payments;
DROP POLICY IF EXISTS "subscription_payments_select" ON public.subscription_payments;

-- 2) 새 정책: super_admin 전용 (시설→소유자 조인 경로 확인 후 확장 예정)
CREATE POLICY "subscription_payments_select_restricted"
  ON public.subscription_payments FOR SELECT
  USING (public.is_super_admin());

-- =============================================
-- 완료 확인 쿼리
-- =============================================
-- SELECT 'BATCH1_COMPLETE' AS result;
