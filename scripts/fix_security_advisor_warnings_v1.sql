-- ========================================================================
-- Supabase 보안 종합 해결 스크립트 (WARN 레벨 해결 - v1.0)
-- ========================================================================
-- 1. Function Search Path Mutable 보안 강화 (24개 함수)
-- 2. RLS Policy Always True 정책 정교화
-- ========================================================================

BEGIN;

-- ========================================================================
-- PART 1: Function Search Path 고정
-- ========================================================================
-- 함수 및 트리거 함수들이 특정 스키마(public)에 고정되도록 설정하여 보안 향상

ALTER FUNCTION public.sync_user_role_to_sangjo SET search_path = public;
ALTER FUNCTION public.search_facilities_v2 SET search_path = public;
ALTER FUNCTION public.update_updated_at_column SET search_path = public;
ALTER FUNCTION public.create_default_timeline_events SET search_path = public;
ALTER FUNCTION public.approve_partner_transaction SET search_path = public;
ALTER FUNCTION public.is_super_admin SET search_path = public;
ALTER FUNCTION public.approve_partner_and_grant_role SET search_path = public;
ALTER FUNCTION public.update_funeral_progress_timestamp SET search_path = public;
ALTER FUNCTION public.user_id SET search_path = public;
ALTER FUNCTION public.search_facilities SET search_path = public;
ALTER FUNCTION public.log_admin_action SET search_path = public;
ALTER FUNCTION public.approve_facility_partner_rpc SET search_path = public;
ALTER FUNCTION public.handle_new_user SET search_path = public;
ALTER FUNCTION public.get_distinct_regions SET search_path = public;
ALTER FUNCTION public.search_facilities_in_view SET search_path = public;
ALTER FUNCTION public.clerk_user_id SET search_path = public;
ALTER FUNCTION public.notify_webhook_on_notification SET search_path = public;
ALTER FUNCTION public.get_current_user_id SET search_path = public;
ALTER FUNCTION public.update_consultations_updated_at SET search_path = public;
ALTER FUNCTION public.search_facilities_by_text SET search_path = public;
ALTER FUNCTION public.update_timeline_and_notify SET search_path = public;
ALTER FUNCTION public.current_user_id SET search_path = public;
ALTER FUNCTION public.update_timestamp SET search_path = public;

-- ========================================================================
-- PART 2: RLS Policy Always True 수정
-- ========================================================================

-- 2-1. profiles: 자신의 프로필만 생성/수정 가능하도록 수정
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 강화된 정책 생성 (auth.jwt() ->> 'sub'를 사용하여 Clerk ID 검증)
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (id = (SELECT auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (id = (SELECT auth.jwt() ->> 'sub'))
WITH CHECK (id = (SELECT auth.jwt() ->> 'sub'));


-- 2-2. facility_subscriptions: 관리자 또는 시설 소유자만 관리 가능하도록 수정
ALTER TABLE public.facility_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Auth Access" ON public.facility_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.facility_subscriptions;

CREATE POLICY "Manage own subscriptions or Admin" ON public.facility_subscriptions
FOR ALL TO authenticated
USING (
    (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE clerk_id = (SELECT auth.jwt() ->> 'sub')
        AND role::text = 'super_admin'
    )) OR 
    (facility_id_uuid IN (
        SELECT id FROM public.facilities 
        WHERE user_id = (SELECT auth.jwt() ->> 'sub')
    ))
);


-- 2-3. funeral_companies: 관리자만 수정 가능하도록 수정 (읽기는 공개 정책이 이미 있다고 가정)
ALTER TABLE public.funeral_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated upsert on funeral_companies" ON public.funeral_companies;

CREATE POLICY "Admin only upsert" ON public.funeral_companies
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE clerk_id = (SELECT auth.jwt() ->> 'sub')
        AND role::text IN ('super_admin', 'sangjo_manager')
    )
);

COMMIT;

-- 결과 확인용 공지
DO $$ 
BEGIN
    RAISE NOTICE '✅ WARN 레벨 보안 이슈 (Search Path, Always True) 해결 스크립트 실행 완료';
END $$;
