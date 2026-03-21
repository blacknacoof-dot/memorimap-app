-- ============================================================
-- 파트너 승인/거절 RPC 원자성 보장 + 알림 INSERT 포함
-- 문제: user_notifications에 INSERT RLS가 없어서 클라이언트에서 알림 생성 실패
-- 해결: 알림 INSERT를 SECURITY DEFINER RPC 안으로 이동
-- ============================================================

-- 1. approve_partner_transaction 보강 (알림 + 동일 업체 자동 거절 포함)
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

    -- 1. 신규 시설 생성
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

    -- 2. partners 테이블 INSERT
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

    -- 3. 상조 관련 테이블
    IF v_inquiry.business_type = 'sangjo_hq' OR v_inquiry.business_type = 'sangjo' THEN
        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_partner_id::text, v_inquiry.company_name, 'hq_admin')
        ON CONFLICT DO NOTHING;

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

    -- 5. 동일 업체 다른 pending 신청 자동 거절
    UPDATE partner_inquiries
    SET status = 'rejected',
        message = '[System] 동일 업체 다른 신청이 승인되어 자동 반려됨.',
        updated_at = now()
    WHERE company_name = v_inquiry.company_name
      AND status = 'pending'
      AND id != p_inquiry_id;

    -- 6. 유저 프로필 역할 업데이트
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

    -- 7. 감사 로그
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_admin_id, 'APPROVE_PARTNER', 'partner_inquiries', p_inquiry_id::text,
            jsonb_build_object(
                'action_category', 'ADMIN_ACTION',
                'facility_id', v_facility_id,
                'partner_id', v_partner_id,
                'company_name', v_inquiry.company_name,
                'role_assigned', true
            ));

    -- 8. 인앱 알림 (SECURITY DEFINER 내부이므로 RLS 우회)
    INSERT INTO user_notifications (user_id, title, message, type, link)
    VALUES (
        v_inquiry.user_id,
        '입점 신청 승인 완료',
        '축하합니다! ' || v_inquiry.company_name || '의 입점 신청이 승인되었습니다. 지금 바로 대시보드에서 시설 정보를 관리해보세요.',
        'success',
        '/dashboard'
    );

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

-- 2. reject_partner_transaction 신규 (원자적 거절 처리)
CREATE OR REPLACE FUNCTION public.reject_partner_transaction(
    p_inquiry_id BIGINT,
    p_admin_id TEXT,
    p_reason TEXT DEFAULT '운영팀 문의 요망'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inquiry RECORD;
    v_affected_count INT;
BEGIN
    -- 신청서 조회 및 잠금
    SELECT * INTO v_inquiry
    FROM partner_inquiries
    WHERE id = p_inquiry_id
    FOR UPDATE;

    IF v_inquiry IS NULL THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;
    IF v_inquiry.status != 'pending' THEN RAISE EXCEPTION '이미 처리된 건입니다.'; END IF;

    -- 1. 같은 회사의 모든 pending 신청 일괄 거절
    UPDATE partner_inquiries
    SET status = 'rejected',
        message = '[System] 반려 사유: ' || p_reason,
        updated_at = now()
    WHERE company_name = v_inquiry.company_name
      AND status = 'pending';

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    -- 2. 감사 로그
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_admin_id, 'REJECT_PARTNER', 'partner_inquiries', p_inquiry_id::text,
            jsonb_build_object(
                'action_category', 'ADMIN_ACTION',
                'reason', p_reason,
                'bulk', true,
                'affected_count', v_affected_count,
                'company_name', v_inquiry.company_name
            ));

    -- 3. 인앱 알림 (SECURITY DEFINER 내부이므로 RLS 우회)
    INSERT INTO user_notifications (user_id, title, message, type)
    VALUES (
        v_inquiry.user_id,
        '입점 신청 반려 안내',
        '신청하신 ' || v_inquiry.company_name || '의 입점 신청이 반려되었습니다. 사유: ' || p_reason,
        'warning'
    );

    RETURN jsonb_build_object(
        'success', true,
        'action', 'rejected',
        'affected_count', v_affected_count,
        'company_name', v_inquiry.company_name
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
