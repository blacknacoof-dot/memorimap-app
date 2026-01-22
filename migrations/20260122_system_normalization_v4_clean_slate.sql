-- =====================================================
-- Memorimap System Normalization Script (v4.0)
-- Strategy: Clean Slate (Backup & Recreate)
-- Purpose: Definitively fix "column user_id does not exist"
-- =====================================================

-- 1. Teardown Old Objects (Cascade ensures dependent policies/functions are removed)
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.approve_partner_transaction(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action(TEXT, TEXT, TEXT, JSONB) CASCADE;

-- 2. Drop Admin Tables (Safe to recreate as we just have seed data)
DROP TABLE IF EXISTS public.super_admins CASCADE;
DROP TABLE IF EXISTS public.sangjo_hq_admins CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- 3. Backup Legacy Facilities Table (Move it out of the way)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facilities') THEN
        -- Check if it's already a backup or valid? Just rename it to be safe.
        -- We will rename it to facilities_backup_{timestamp} roughly
        ALTER TABLE public.facilities RENAME TO facilities_backup_v4;
    END IF;
END $$;

-- =====================================================
-- 4. Create Tables (Fresh & Correct)
-- =====================================================

-- 4.1 Super Admins
CREATE TABLE public.super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE, -- Clerk ID
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    memo TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT
);
CREATE INDEX idx_super_admins_user_id ON public.super_admins(user_id);

-- 4.2 Sangjo HQ Admins
CREATE TABLE public.sangjo_hq_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, 
    sangjo_id TEXT NOT NULL,
    company_name TEXT,
    role TEXT DEFAULT 'hq_admin',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3 App Facilities (Fresh)
CREATE TABLE public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- The columns causing issues are now guaranteed
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
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    status TEXT DEFAULT 'pending',
    view_count INTEGER DEFAULT 0,
    rating DECIMAL(2, 1),
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_facilities_user_id ON public.facilities(user_id);
CREATE INDEX idx_facilities_verified ON public.facilities(verified);

-- 4.4 Audit Logs
CREATE TABLE public.audit_logs (
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
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);


-- =====================================================
-- 5. Functions & RLS
-- =====================================================

-- 5.1 is_super_admin (Security Definer)
CREATE FUNCTION public.is_super_admin()
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

-- 5.2 log_admin_action
CREATE FUNCTION public.log_admin_action(
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

-- 5.3 approve_partner_transaction (RPC)
CREATE FUNCTION public.approve_partner_transaction(
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
BEGIN
    SELECT * INTO v_inquiry FROM partner_inquiries WHERE id = p_inquiry_id;
    
    IF v_inquiry IS NULL THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;
    IF v_inquiry.status != 'pending' THEN RAISE EXCEPTION '이미 처리된 건입니다.'; END IF;

    -- Create Facility
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
        COALESCE(v_inquiry.contact_number, ''), -- Use verified columns
        true, 
        'active',
        '{}'::jsonb,
        now()
    ) RETURNING id INTO v_facility_id;

    -- Sangjo Logic
    IF v_inquiry.business_type = 'sangjo_hq' OR v_inquiry.business_type = 'sangjo' THEN
        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_facility_id::text, v_inquiry.company_name, 'hq_admin');
    END IF;

    -- Update Inquiry
    UPDATE partner_inquiries 
    SET status = 'approved', 
        target_facility_id = v_facility_id::text 
    WHERE id = p_inquiry_id;

    -- Log
    INSERT INTO audit_logs (actor_id, action, target_resource, target_id, details)
    VALUES (p_admin_id, 'APPROVE_PARTNER', 'partner_inquiries', p_inquiry_id::text, 
            jsonb_build_object('facility_id', v_facility_id));

    RETURN jsonb_build_object('success', true, 'facility_id', v_facility_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =====================================================
-- 6. Seed Data & Policies
-- =====================================================

-- Seed Admin
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

-- Policies
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view all" ON public.super_admins FOR SELECT TO authenticated
USING (user_id = (auth.jwt() ->> 'sub') OR public.is_super_admin());

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated
USING (public.is_super_admin());
CREATE POLICY "Service role insert logs" ON public.audit_logs FOR INSERT TO service_role WITH CHECK (true);

-- Partner Inquiries Policies (Reset first)
DROP POLICY IF EXISTS "Enable select for super admins" ON partner_inquiries;
DROP POLICY IF EXISTS "Enable update for super admins" ON partner_inquiries;

CREATE POLICY "Enable select for super admins" ON partner_inquiries FOR SELECT TO authenticated
USING (user_id = (auth.jwt() ->> 'sub') OR public.is_super_admin());

CREATE POLICY "Enable update for super admins" ON partner_inquiries FOR UPDATE TO authenticated
USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Facilities Policies
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own facilities" ON public.facilities FOR SELECT TO authenticated
USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Super admins can view all facilities" ON public.facilities FOR SELECT TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Super admins can update all facilities" ON public.facilities FOR UPDATE TO authenticated
USING (public.is_super_admin());
