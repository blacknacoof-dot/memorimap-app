-- Fix: approve_partner_transaction RPC에 sangjo_dashboard_users, partners 테이블 INSERT 추가
-- E2E 흐름: 파트너 승인 → 대시보드 접근 가능하도록

-- 기존 함수 교체
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
    v_partner_id UUID;
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

    -- 2. partners 테이블에도 INSERT (PartnerDashboard, PartnerManagement에서 사용)
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
    IF v_inquiry.business_type = 'sangjo_hq' OR v_inquiry.business_type = 'sangjo' THEN
        -- sangjo_hq_admins (기존)
        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_partner_id::text, v_inquiry.company_name, 'hq_admin')
        ON CONFLICT DO NOTHING;

        -- sangjo_dashboard_users (누락이었음 - getSangjoUser()에서 사용)
        INSERT INTO sangjo_dashboard_users (id, sangjo_id, role, name)
        VALUES (v_inquiry.user_id, v_partner_id::text, 'admin', v_inquiry.company_name)
        ON CONFLICT (id) DO UPDATE SET sangjo_id = EXCLUDED.sangjo_id, role = EXCLUDED.role;
    END IF;

    -- 4. 신청서 상태 업데이트
    UPDATE partner_inquiries
    SET status = 'approved',
        target_facility_id = v_facility_id::text,
        updated_at = now()
    WHERE id = p_inquiry_id;

    -- 5. 유저 프로필 역할 업데이트
    UPDATE public.profiles
    SET role = (
        CASE
            WHEN v_inquiry.business_type = 'sangjo_hq' THEN 'sangjo_hq_admin'
            WHEN v_inquiry.business_type = 'sangjo' THEN 'sangjo_user'
            ELSE 'facility_admin'
        END
    )::public.user_role,
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
