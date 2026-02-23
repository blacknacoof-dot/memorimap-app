-- ============================================================
-- 20260223_critical_fixes.sql
-- CRITICAL 3건 수정
-- 1. reservations: payment_amount / paid_at 컬럼 추가
-- 2. timeline_events / facility_submissions / notification_logs: RLS 활성화
-- 3. subscription_payments: INSERT 위조 방지 정책 수정
-- ============================================================

BEGIN;

-- ============================================================
-- FIX-1: reservations 테이블에 누락된 결제 컬럼 추가
-- verify-payment Edge Function이 참조하는 컬럼
-- ============================================================

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_amount INTEGER;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ============================================================
-- FIX-2: RLS 미설정 테이블 3건 활성화 + 기본 정책 추가
-- ============================================================

-- 2-A: timeline_events
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_events_select_own"
  ON public.timeline_events FOR SELECT
  TO authenticated
  USING (user_id::text = public.clerk_user_id());

CREATE POLICY "timeline_events_insert_own"
  ON public.timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = public.clerk_user_id());

CREATE POLICY "timeline_events_update_own"
  ON public.timeline_events FOR UPDATE
  TO authenticated
  USING (user_id::text = public.clerk_user_id());

CREATE POLICY "timeline_events_delete_own"
  ON public.timeline_events FOR DELETE
  TO authenticated
  USING (user_id::text = public.clerk_user_id());

CREATE POLICY "timeline_events_super_admin_all"
  ON public.timeline_events FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- 2-B: facility_submissions
ALTER TABLE public.facility_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facility_submissions_select_own"
  ON public.facility_submissions FOR SELECT
  TO authenticated
  USING (applicant_user_id::text = public.clerk_user_id());

CREATE POLICY "facility_submissions_insert_own"
  ON public.facility_submissions FOR INSERT
  TO authenticated
  WITH CHECK (applicant_user_id::text = public.clerk_user_id());

CREATE POLICY "facility_submissions_super_admin_all"
  ON public.facility_submissions FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- 2-C: notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_logs_select_own"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (user_id::text = public.clerk_user_id());

CREATE POLICY "notification_logs_insert_service"
  ON public.notification_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "notification_logs_super_admin_all"
  ON public.notification_logs FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- ============================================================
-- FIX-3: subscription_payments INSERT 위조 방지
-- 기존: WITH CHECK (true) → 아무나 결제 레코드 생성 가능
-- 수정: service_role만 INSERT 허용 (Edge Function/서버만 가능)
-- ============================================================

DROP POLICY IF EXISTS "subscription_payments_insert" ON public.subscription_payments;

CREATE POLICY "subscription_payments_insert_service_only"
  ON public.subscription_payments FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMIT;
