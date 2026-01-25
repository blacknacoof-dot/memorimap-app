
-- 1. target_facility_id 컬럼 타입을 UUID를 수용할 수 있도록 TEXT로 확장 (기존 데이터 보존)
ALTER TABLE public.partner_inquiries 
ALTER COLUMN target_facility_id TYPE TEXT USING target_facility_id::text;

-- 2. 기존 UUID 기반 함수 삭제
DROP FUNCTION IF EXISTS public.approve_partner_transaction(UUID, TEXT);

-- 3. 숫자(BIGINT) 기반으로 함수 재생성 (견고성 강화 버전)
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
BEGIN
    -- [보안/견고성] 트랜잭션 시작 시 상태 확인 및 잠금 (Race Condition 방지)
    SELECT * INTO v_inquiry 
    FROM partner_inquiries 
    WHERE id = p_inquiry_id 
    FOR UPDATE; -- 해당 행 잠금
    
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

    -- 2. 상조 관리자 권한 부여 (필요 시)
    IF v_inquiry.business_type = 'sangjo_hq' OR v_inquiry.business_type = 'sangjo' THEN
        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_facility_id::text, v_inquiry.company_name, 'hq_admin');
    END IF;

    -- 3. 신청서 상태 업데이트 (target_facility_id에 생성된 UUID 저장)
    UPDATE partner_inquiries 
    SET status = 'approved', 
        target_facility_id = v_facility_id::text,
        updated_at = now()
    WHERE id = p_inquiry_id;

    -- 4. 유저 프로필 역할 업데이트 (시설 관리자 권한 부여)
    UPDATE public.profiles 
    SET role = CASE 
        WHEN v_inquiry.business_type = 'sangjo_hq' THEN 'sangjo_hq_admin'
        WHEN v_inquiry.business_type = 'sangjo' THEN 'sangjo_user'
        ELSE 'facility_admin' 
    END,
    updated_at = now()
    WHERE clerk_id = v_inquiry.user_id;

    -- 5. 관리 로그 기록
    INSERT INTO audit_logs (actor_id, action, target_resource, target_id, details)
    VALUES (p_admin_id, 'APPROVE_PARTNER', 'partner_inquiries', p_inquiry_id::text, 
            jsonb_build_object(
                'facility_id', v_facility_id,
                'company_name', v_inquiry.company_name,
                'role_assigned', true,
                'bulk_archived', false
            ));

    RETURN jsonb_build_object(
        'success', true, 
        'facility_id', v_facility_id,
        'action', 'approved'
    );

EXCEPTION WHEN OTHERS THEN
    -- 에러 발생 시 롤백됨
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
