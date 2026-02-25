-- ============================================================
-- Supabase Linter ERROR/WARN 수정 (2026-02-24)
-- ERROR 2건 + WARN 9건 수정 (spatial_ref_sys는 PostGIS 소유 → 수정 불가)
-- ============================================================

BEGIN;

-- ERROR-1: admin_subscriptions_with_facility SECURITY INVOKER
DROP VIEW IF EXISTS public.admin_subscriptions_with_facility;
CREATE VIEW public.admin_subscriptions_with_facility
WITH (security_invoker = true)
AS
SELECT fs.*, f.name AS facility_name
FROM public.facility_subscriptions fs
LEFT JOIN public.facilities f ON fs.facility_id = f.id;
GRANT SELECT ON public.admin_subscriptions_with_facility TO authenticated;
GRANT SELECT ON public.admin_subscriptions_with_facility TO service_role;

-- ERROR-3: rate_limit_log RLS
ALTER TABLE IF EXISTS public.rate_limit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rate_limit_log_service_insert" ON public.rate_limit_log;
CREATE POLICY "rate_limit_log_service_insert" ON public.rate_limit_log FOR INSERT TO service_role WITH CHECK (true);
DROP POLICY IF EXISTS "rate_limit_log_service_select" ON public.rate_limit_log;
CREATE POLICY "rate_limit_log_service_select" ON public.rate_limit_log FOR SELECT TO service_role USING (true);
DROP POLICY IF EXISTS "rate_limit_log_admin_select" ON public.rate_limit_log;
CREATE POLICY "rate_limit_log_admin_select" ON public.rate_limit_log FOR SELECT TO authenticated USING (public.is_super_admin());

-- WARN: 함수 search_path 고정
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS TEXT LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT auth.uid()::text;
$$;

CREATE OR REPLACE FUNCTION public.update_facility_packages_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- WARN: ai_consultations INSERT
DROP POLICY IF EXISTS "ai_consultations_user_insert" ON public.ai_consultations;
CREATE POLICY "ai_consultations_user_insert" ON public.ai_consultations FOR INSERT TO authenticated WITH CHECK (user_id = public.clerk_user_id());

-- WARN: partner_inquiries INSERT 중복 정리
DROP POLICY IF EXISTS "partner_inquiries_insert_auth" ON public.partner_inquiries;
DROP POLICY IF EXISTS "partner_inquiries_insert_authenticated" ON public.partner_inquiries;
CREATE POLICY "partner_inquiries_insert_own" ON public.partner_inquiries FOR INSERT TO authenticated WITH CHECK (user_id = public.clerk_user_id());

-- WARN: sangjo_contracts INSERT 중복 정리 → sangjo 관리자만 INSERT 허용
DROP POLICY IF EXISTS "sangjo_contracts_insert" ON public.sangjo_contracts;
DROP POLICY IF EXISTS "sangjo_contracts_insert_auth" ON public.sangjo_contracts;
CREATE POLICY "sangjo_contracts_insert_own" ON public.sangjo_contracts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sangjo_hq_admins
      WHERE sangjo_hq_admins.sangjo_id = sangjo_contracts.sangjo_id
        AND sangjo_hq_admins.user_id::text = public.clerk_user_id()
    )
    OR public.is_super_admin()
  );

-- WARN: system_logs INSERT authenticated 제거 (service_role만 사용)
DROP POLICY IF EXISTS "system_logs_insert_authenticated" ON public.system_logs;

COMMIT;
