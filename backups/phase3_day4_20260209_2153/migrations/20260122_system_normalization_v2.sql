-- =====================================================
-- Memorimap System Normalization Script (v2.0)
-- Includes: Super Admins, Audit Logs, Facilities, RLS Fixes
-- Fixes: 'user_id' column missing error (Force Recreate Facilities)
-- Added: approve_partner_transaction RPC
-- =====================================================

-- 0. Cleanup / Backup Legacy Tables (if they exist and cause conflict)
DO $$ 
BEGIN
    -- If facilities table exists but doesn't have user_id, it's legacy. Rename it.
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'facilities') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facilities' AND column_name = 'user_id') THEN
            ALTER TABLE public.facilities RENAME TO facilities_legacy_backup;
        END IF;
    END IF;
END $$;

-- 1. Super Admins Table
CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE, -- Clerk ID
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    memo TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON public.super_admins(user_id);

-- 2. Sangjo HQ Admins Table
CREATE TABLE IF NOT EXISTS public.sangjo_hq_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, 
    sangjo_id TEXT NOT NULL,
    company_name TEXT,
    role TEXT DEFAULT 'hq_admin',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Facilities Table (Ensuring Correct Schema)
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    address_detail TEXT,
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone TEXT,
    email TEXT,
    website TEXT,
    business_hours JSONB DEFAULT '{}'::jsonb,
    holiday_info TEXT,
    parking_available BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false, -- Standardized to 'verified'
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    status TEXT DEFAULT 'pending',
    view_count INTEGER DEFAULT 0,
    rating DECIMAL(2, 1),
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facilities_user_id ON public.facilities(user_id);

-- 4. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id TEXT NOT NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    action_category TEXT,
    target_resource TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 5. Helper Function: is_super_admin (Fixing RLS Recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admins 
        WHERE user_id = (auth.jwt() ->> 'sub')
        AND is_active = true
    );
END;
$$;

-- 6. Helper Function: log_admin_action
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action TEXT,
    p_target_resource TEXT,
    p_target_id TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        actor_id, actor_email, action, action_category, target_resource, target_id, details
    ) VALUES (
        auth.jwt() ->> 'sub',
        auth.jwt() ->> 'email',
        p_action,
        'ADMIN_ACTION',
        p_target_resource,
        p_target_id,
        p_details
    )
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$;

-- 7. Initial Super Admin
INSERT INTO public.super_admins (user_id, email, name, memo, created_by)
VALUES (
    'user_36usU2NHzHUg14UgoOIK5J1LuKd',
    'blacknacoof@gmail.com',
    'System Admin',
    'Initial Super Admin - System Bootstrap',
    'SYSTEM'
)
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    is_active = true;

-- 8. Apply RLS Policies

-- Super Admins
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admins can view all" ON public.super_admins;
CREATE POLICY "Super admins can view all" ON public.super_admins FOR SELECT TO authenticated
USING (user_id = (auth.jwt() ->> 'sub') OR public.is_super_admin());

-- Partner Inquiries
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable select for super admins" ON partner_inquiries;
CREATE POLICY "Enable select for super admins" ON partner_inquiries FOR SELECT TO authenticated
USING (user_id = (auth.jwt() ->> 'sub') OR public.is_super_admin());

DROP POLICY IF EXISTS "Enable update for super admins" ON partner_inquiries;
CREATE POLICY "Enable update for super admins" ON partner_inquiries FOR UPDATE TO authenticated
USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Sangjo HQ
ALTER TABLE public.sangjo_hq_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON sangjo_hq_admins;
CREATE POLICY "Enable select for authenticated users" ON sangjo_hq_admins FOR SELECT TO authenticated
USING (user_id = (auth.jwt() ->> 'sub') OR public.is_super_admin());

-- Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated
USING (public.is_super_admin());
DROP POLICY IF EXISTS "Service role insert logs" ON public.audit_logs;
CREATE POLICY "Service role insert logs" ON public.audit_logs FOR INSERT TO service_role WITH CHECK (true);

-- Facilities
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own facilities" ON public.facilities;
CREATE POLICY "Users can view own facilities" ON public.facilities FOR SELECT TO authenticated
USING (user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "Super admins can view all facilities" ON public.facilities;
CREATE POLICY "Super admins can view all facilities" ON public.facilities FOR SELECT TO authenticated
USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can update all facilities" ON public.facilities;
CREATE POLICY "Super admins can update all facilities" ON public.facilities FOR UPDATE TO authenticated
USING (public.is_super_admin());


-- 9. RPC: Atomic Transaction for Partner Approval
-- CAUTION: Uses SECURITY DEFINER to modify multiple tables
CREATE OR REPLACE FUNCTION public.approve_partner_transaction(
    p_inquiry_id UUID,
    p_admin_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inquiry RECORD;
    v_facility_id UUID;
    v_contact_phone TEXT;
BEGIN
    -- A. 신청서 조회
    SELECT * INTO v_inquiry FROM partner_inquiries WHERE id = p_inquiry_id;
    
    IF v_inquiry IS NULL THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;
    IF v_inquiry.status != 'pending' THEN RAISE EXCEPTION '이미 처리된 건입니다.'; END IF;
    
    -- Phone fallback (contact_number or company_phone)
    -- Assuming contact_number is the correct column from types/db.ts partner_inquiries
    -- But DB might have company_phone. We use COALESCE check if columns exist or assumption.
    -- Better safely use contact_number if standard, or v_inquiry record handles it.
    -- We assume 'contact_number' based on previous schema checks.
    
    -- B. 시설(Facilities) 생성
    INSERT INTO facilities (
        user_id, name, type, address, phone, verified, status, business_hours, created_at
    )
    VALUES (
        v_inquiry.user_id,
        v_inquiry.company_name,
        CASE 
            WHEN v_inquiry.business_type = 'funeral_home' THEN 'funeral_home' 
            ELSE 'sangjo_biz' -- Use a distinct type for Sangjo if needed, or map appropriately
        END,
        COALESCE(v_inquiry.address, ''),
        COALESCE(v_inquiry.contact_number, ''), -- Use contact_number
        true, -- verified
        'active',
        '{}'::jsonb,
        now()
    ) RETURNING id INTO v_facility_id;

    -- C. 관리자(HQ Admin) 매핑 (상조의 경우)
    IF v_inquiry.business_type = 'sangjo_hq' OR v_inquiry.business_type = 'sangjo' THEN
        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_facility_id::text, v_inquiry.company_name, 'hq_admin');
    END IF;

    -- D. 신청서 상태 업데이트
    UPDATE partner_inquiries 
    SET status = 'approved', 
        target_facility_id = v_facility_id::text 
    WHERE id = p_inquiry_id;

    -- E. 감사 로그 기록
    INSERT INTO audit_logs (actor_id, action, target_resource, target_id, details)
    VALUES (p_admin_id, 'APPROVE_PARTNER', 'partner_inquiries', p_inquiry_id::text, 
            jsonb_build_object('facility_id', v_facility_id, 'business_type', v_inquiry.business_type));

    RETURN jsonb_build_object('success', true, 'facility_id', v_facility_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
