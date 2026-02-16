-- =============================================
-- [출시 준비] 통합 DB 마이그레이션
-- 2026-02-16: DB + 코드 무결점 점검 결과 반영
-- =============================================

BEGIN;

-- =============================================
-- A1. is_super_admin 함수 오버로드 (두 버전 모두 생성)
-- 문제: 20260205 마이그레이션이 무인자 버전을 DROP → RLS 정책 전체 깨짐
-- =============================================

-- 무인자 버전 (RLS 정책에서 사용)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = public.clerk_user_id()
      AND role = 'super_admin'
  );
END;
$$;

-- 파라미터 버전 (코드에서 RPC 호출용: useSuperAdmin.ts)
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = p_user_id
      AND role = 'super_admin'
  );
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(TEXT) TO authenticated;

-- =============================================
-- A2. partners.id DEFAULT 추가
-- 문제: approve_partner_transaction이 id 없이 INSERT → NOT NULL 위반
-- =============================================
ALTER TABLE public.partners ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- =============================================
-- A3. approve_partner_transaction RPC 재생성
-- 문제: v_partner_id UUID인데 partners.id는 TEXT
-- =============================================
CREATE OR REPLACE FUNCTION public.approve_partner_transaction(
    p_inquiry_id BIGINT,
    p_admin_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inquiry RECORD;
    v_facility_id UUID;
    v_partner_id TEXT;  -- 수정: UUID → TEXT (partners.id는 TEXT PK)
BEGIN
    -- 트랜잭션 시작 시 상태 확인 및 잠금
    SELECT * INTO v_inquiry
    FROM partner_inquiries
    WHERE id = p_inquiry_id
    FOR UPDATE;

    IF v_inquiry IS NULL THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;
    IF v_inquiry.status != 'pending' THEN RAISE EXCEPTION '이미 처리된 건입니다.'; END IF;

    -- 1. 신규 시설 생성 (facilities 테이블)
    INSERT INTO facilities (
        user_id, name, type, address, phone, verified, status, business_hours, created_at
    )
    VALUES (
        v_inquiry.user_id,
        v_inquiry.company_name,
        CASE
            WHEN v_inquiry.business_type = 'funeral_home' THEN 'funeral_home'
            ELSE 'sangjo_biz'
        END,
        COALESCE(v_inquiry.address, ''),
        COALESCE(v_inquiry.contact_number, ''),
        true,
        'active',
        '{}'::jsonb,
        now()
    ) RETURNING id INTO v_facility_id;

    -- 2. partners 테이블에도 INSERT
    INSERT INTO partners (
        name, company_name, status, subscription_plan,
        contact_person, contact_phone, contact_email,
        funeral_location, created_at
    )
    VALUES (
        v_inquiry.company_name,
        v_inquiry.company_name,
        'approved',
        'basic',
        COALESCE(v_inquiry.contact_person, v_inquiry.manager_name, ''),
        COALESCE(v_inquiry.contact_number, v_inquiry.phone, ''),
        COALESCE(v_inquiry.company_email, v_inquiry.email, ''),
        COALESCE(v_inquiry.address, ''),
        now()
    ) RETURNING id INTO v_partner_id;

    -- 3. 상조 관련 테이블 INSERT
    IF v_inquiry.business_type IN ('sangjo_hq', 'sangjo') THEN
        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_partner_id, v_inquiry.company_name, 'hq_admin')
        ON CONFLICT DO NOTHING;

        INSERT INTO sangjo_dashboard_users (id, sangjo_id, role, name)
        VALUES (v_inquiry.user_id, v_partner_id, 'admin', v_inquiry.company_name)
        ON CONFLICT (id) DO UPDATE SET sangjo_id = EXCLUDED.sangjo_id, role = EXCLUDED.role;
    END IF;

    -- 4. 신청서 상태 업데이트 (target_facility_id에 생성된 시설 ID 저장)
    UPDATE partner_inquiries
    SET status = 'approved',
        target_facility_id = v_facility_id::text,
        updated_at = now()
    WHERE id = p_inquiry_id;

    -- 5. 유저 프로필 역할 업데이트
    UPDATE public.profiles
    SET role = CASE
        WHEN v_inquiry.business_type = 'sangjo_hq' THEN 'sangjo_hq_admin'
        WHEN v_inquiry.business_type = 'sangjo' THEN 'sangjo_user'
        ELSE 'facility_admin'
    END,
    updated_at = now()
    WHERE clerk_id = v_inquiry.user_id;

    -- 6. 관리 로그 기록
    INSERT INTO audit_logs (actor_id, action, target_resource, target_id, details)
    VALUES (p_admin_id, 'APPROVE_PARTNER', 'partner_inquiries', p_inquiry_id::text,
            jsonb_build_object(
                'facility_id', v_facility_id,
                'partner_id', v_partner_id,
                'company_name', v_inquiry.company_name,
                'role_assigned', true
            ));

    RETURN jsonb_build_object(
        'success', true,
        'facility_id', v_facility_id,
        'partner_id', v_partner_id,
        'action', 'approved'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =============================================
-- A4. 누락 가능 테이블 생성 (IF NOT EXISTS)
-- =============================================

-- sangjo_contracts
CREATE TABLE IF NOT EXISTS public.sangjo_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT UNIQUE,
    sangjo_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    product_name TEXT,
    status TEXT DEFAULT '상담신청',
    notes TEXT,
    assigned_to TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sangjo_contracts ENABLE ROW LEVEL SECURITY;

-- sangjo_contract_timeline
CREATE TABLE IF NOT EXISTS public.sangjo_contract_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT REFERENCES public.sangjo_contracts(contract_number) ON DELETE CASCADE,
    event TEXT NOT NULL,
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sangjo_contract_timeline ENABLE ROW LEVEL SECURITY;

-- sangjo_dashboard_users
CREATE TABLE IF NOT EXISTS public.sangjo_dashboard_users (
    id TEXT PRIMARY KEY,
    sangjo_id TEXT,
    role TEXT DEFAULT 'viewer',
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sangjo_dashboard_users ENABLE ROW LEVEL SECURITY;

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id TEXT,
    actor_email TEXT,
    action TEXT NOT NULL,
    action_category TEXT,
    target_resource TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}',
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- system_logs
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT DEFAULT 'INFO',
    message TEXT,
    meta JSONB DEFAULT '{}',
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- user_notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- platform_notices
CREATE TABLE IF NOT EXISTS public.platform_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    priority TEXT DEFAULT 'normal',
    is_active BOOLEAN DEFAULT true,
    target_partner_ids TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.platform_notices ENABLE ROW LEVEL SECURITY;

-- leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_name TEXT,
    phone_number TEXT,
    category TEXT,
    status TEXT DEFAULT 'new',
    facility_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- facility_scenarios
CREATE TABLE IF NOT EXISTS public.facility_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    scenario_type TEXT,
    title TEXT,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.facility_scenarios ENABLE ROW LEVEL SECURITY;

-- notices (공지사항)
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    author_id TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- admin_subscriptions_with_facility VIEW
CREATE OR REPLACE VIEW public.admin_subscriptions_with_facility AS
SELECT
    fs.id,
    fs.plan_id,
    fs.status,
    fs.start_date,
    fs.end_date,
    fs.next_billing_date,
    fs.created_at,
    fs.updated_at,
    fs.facility_id_uuid,
    fs.facility_id_bigint,
    COALESCE(f.name, '(삭제된 시설)') AS facility_name
FROM public.facility_subscriptions fs
LEFT JOIN public.facilities f ON f.id = fs.facility_id_uuid;

-- =============================================
-- A5. system_settings RLS 정책
-- =============================================
DROP POLICY IF EXISTS "system_settings_super_admin_read" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_super_admin_write" ON public.system_settings;

CREATE POLICY "system_settings_super_admin_read"
ON public.system_settings FOR SELECT
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "system_settings_super_admin_write"
ON public.system_settings FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- =============================================
-- A6. notices RLS 정책
-- =============================================
DROP POLICY IF EXISTS "notices_select_all" ON public.notices;
DROP POLICY IF EXISTS "notices_super_admin_all" ON public.notices;
DROP POLICY IF EXISTS "notices_crud_super_admin" ON public.notices;

-- 모든 인증 유저: 읽기
CREATE POLICY "notices_select_all"
ON public.notices FOR SELECT
TO authenticated
USING (true);

-- 슈퍼관리자: CRUD 전체
CREATE POLICY "notices_crud_super_admin"
ON public.notices FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- =============================================
-- 추가 RLS 정책 (누락 테이블용)
-- =============================================

-- audit_logs: 슈퍼관리자만 전체, service_role INSERT (Edge Function)
DROP POLICY IF EXISTS "audit_logs_super_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_super_admin"
ON public.audit_logs FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- system_logs: 슈퍼관리자만 읽기
DROP POLICY IF EXISTS "system_logs_super_admin" ON public.system_logs;
CREATE POLICY "system_logs_super_admin"
ON public.system_logs FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- user_notifications: 본인 알림만 읽기
DROP POLICY IF EXISTS "user_notifications_own" ON public.user_notifications;
DROP POLICY IF EXISTS "user_notifications_own_read" ON public.user_notifications;
CREATE POLICY "user_notifications_own_read"
ON public.user_notifications FOR SELECT
TO authenticated
USING (user_id = public.clerk_user_id());

DROP POLICY IF EXISTS "user_notifications_own_update" ON public.user_notifications;
CREATE POLICY "user_notifications_own_update"
ON public.user_notifications FOR UPDATE
TO authenticated
USING (user_id = public.clerk_user_id());

-- user_notifications: 슈퍼관리자 전체
DROP POLICY IF EXISTS "user_notifications_super_admin" ON public.user_notifications;
CREATE POLICY "user_notifications_super_admin"
ON public.user_notifications FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- platform_notices: 인증유저 읽기, 슈퍼관리자 전체
DROP POLICY IF EXISTS "platform_notices_read" ON public.platform_notices;
CREATE POLICY "platform_notices_read"
ON public.platform_notices FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "platform_notices_admin" ON public.platform_notices;
CREATE POLICY "platform_notices_admin"
ON public.platform_notices FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- sangjo_contracts: 상조 관련 유저 + 슈퍼관리자
DROP POLICY IF EXISTS "sangjo_contracts_access" ON public.sangjo_contracts;
CREATE POLICY "sangjo_contracts_access"
ON public.sangjo_contracts FOR ALL
TO authenticated
USING (
    public.is_super_admin()
    OR EXISTS (
        SELECT 1 FROM public.sangjo_dashboard_users sdu
        WHERE sdu.id = public.clerk_user_id()
          AND sdu.sangjo_id = sangjo_contracts.sangjo_id
    )
);

-- sangjo_contract_timeline: 상조 관련 유저 + 슈퍼관리자
DROP POLICY IF EXISTS "sangjo_timeline_access" ON public.sangjo_contract_timeline;
CREATE POLICY "sangjo_timeline_access"
ON public.sangjo_contract_timeline FOR ALL
TO authenticated
USING (
    public.is_super_admin()
    OR EXISTS (
        SELECT 1 FROM public.sangjo_contracts sc
        JOIN public.sangjo_dashboard_users sdu ON sdu.sangjo_id = sc.sangjo_id
        WHERE sc.contract_number = sangjo_contract_timeline.contract_number
          AND sdu.id = public.clerk_user_id()
    )
);

-- sangjo_dashboard_users: 본인 + 슈퍼관리자
DROP POLICY IF EXISTS "sangjo_dashboard_users_access" ON public.sangjo_dashboard_users;
CREATE POLICY "sangjo_dashboard_users_access"
ON public.sangjo_dashboard_users FOR ALL
TO authenticated
USING (
    id = public.clerk_user_id()
    OR public.is_super_admin()
);

-- leads: 슈퍼관리자 전체
DROP POLICY IF EXISTS "leads_super_admin" ON public.leads;
CREATE POLICY "leads_super_admin"
ON public.leads FOR ALL
TO authenticated
USING (public.is_super_admin());

-- leads: 인증 유저 INSERT
DROP POLICY IF EXISTS "leads_insert_authenticated" ON public.leads;
CREATE POLICY "leads_insert_authenticated"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (true);

-- facility_scenarios: 시설 관련 + 슈퍼관리자
DROP POLICY IF EXISTS "facility_scenarios_access" ON public.facility_scenarios;
CREATE POLICY "facility_scenarios_access"
ON public.facility_scenarios FOR ALL
TO authenticated
USING (
    public.is_super_admin()
    OR EXISTS (
        SELECT 1 FROM public.facilities f
        WHERE f.id = facility_scenarios.facility_id
          AND f.user_id = public.clerk_user_id()
    )
);

COMMIT;

-- 확인 메시지
DO $$ BEGIN RAISE NOTICE '출시 준비 마이그레이션 완료: is_super_admin 오버로드, partners.id DEFAULT, approve_partner_transaction 수정, 누락 테이블 생성, RLS 정책 추가'; END $$;
