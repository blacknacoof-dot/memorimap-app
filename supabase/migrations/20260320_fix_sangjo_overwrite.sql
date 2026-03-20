-- ============================================================
-- 20260320_fix_sangjo_overwrite.sql
-- 버그 수정: 파트너 승인 시 기존 sangjo_dashboard_users 레코드 덮어쓰기 방지
--
-- 원인: approve_partner_transaction Step 3에서
--       ON CONFLICT (id) DO UPDATE SET sangjo_id = EXCLUDED.sangjo_id
--       → 이미 다른 상조를 관리 중인 사용자의 sangjo_id가 새 facility_id로 교체됨
--       → 기존 상조 대시보드 접근 불가
--
-- 수정: ON CONFLICT (id) DO NOTHING으로 변경
--       → 이미 상조 관리자인 사용자는 추가 매핑 없이 기존 유지
--       → 신규 시설은 별도 관리자 배정 필요 (or sangjo_hq_admins로 연결)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. DB 복구: 프리드라이프 상조 관리자 복원
-- ─────────────────────────────────────────────

-- 프리드라이프의 facilities.id 확인 후 복원
-- (프리드라이프 sangjo_id를 찾아 sangjo_dashboard_users, sangjo_hq_admins 복원)
DO $$
DECLARE
    v_user_id TEXT;
    v_freedlife_id TEXT;
    v_current_sangjo_id TEXT;
BEGIN
    -- 사용자 ID 조회
    SELECT clerk_id INTO v_user_id
    FROM profiles
    WHERE email = 'black23007@naver.com';

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User not found: black23007@naver.com — skipping recovery';
        RETURN;
    END IF;

    -- 프리드라이프 시설 ID 조회 (funeral_companies 또는 facilities에서)
    SELECT id::text INTO v_freedlife_id
    FROM facilities
    WHERE name LIKE '%프리드라이프%' AND type = 'sangjo'
    LIMIT 1;

    IF v_freedlife_id IS NULL THEN
        -- funeral_companies에서도 검색
        SELECT id INTO v_freedlife_id
        FROM funeral_companies
        WHERE name LIKE '%프리드라이프%'
        LIMIT 1;
    END IF;

    IF v_freedlife_id IS NULL THEN
        RAISE NOTICE 'Freedlife facility not found — skipping recovery';
        RETURN;
    END IF;

    -- 현재 sangjo_dashboard_users의 sangjo_id 확인
    SELECT sangjo_id INTO v_current_sangjo_id
    FROM sangjo_dashboard_users
    WHERE id = v_user_id;

    IF v_current_sangjo_id IS NOT NULL AND v_current_sangjo_id != v_freedlife_id THEN
        -- 프리드라이프로 복원
        UPDATE sangjo_dashboard_users
        SET sangjo_id = v_freedlife_id, role = 'admin'
        WHERE id = v_user_id;

        RAISE NOTICE 'Restored sangjo_dashboard_users: % → % (was %)', v_user_id, v_freedlife_id, v_current_sangjo_id;
    ELSIF v_current_sangjo_id IS NULL THEN
        -- 레코드 자체가 없는 경우 재생성
        INSERT INTO sangjo_dashboard_users (id, sangjo_id, role, name)
        VALUES (v_user_id, v_freedlife_id, 'admin', '프리드라이프')
        ON CONFLICT (id) DO UPDATE SET sangjo_id = v_freedlife_id, role = 'admin';

        RAISE NOTICE 'Re-created sangjo_dashboard_users: % → %', v_user_id, v_freedlife_id;
    ELSE
        RAISE NOTICE 'sangjo_dashboard_users already correct: % → %', v_user_id, v_freedlife_id;
    END IF;

    -- sangjo_hq_admins도 프리드라이프로 복원/확인
    INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
    VALUES (v_user_id, v_freedlife_id, '프리드라이프', 'hq_admin')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'sangjo_hq_admins ensured for user % → %', v_user_id, v_freedlife_id;
END $$;

-- ─────────────────────────────────────────────
-- 2. approve_partner_transaction 수정 (ON CONFLICT DO NOTHING)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_partner_transaction(
    p_inquiry_id BIGINT,
    p_admin_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inquiry RECORD;
    v_facility_id UUID;
    v_partner_id UUID;
    v_existing_sangjo TEXT;
BEGIN
    SELECT * INTO v_inquiry
    FROM partner_inquiries
    WHERE id = p_inquiry_id
    FOR UPDATE;

    IF v_inquiry IS NULL THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;
    IF v_inquiry.status != 'pending' THEN RAISE EXCEPTION '이미 처리된 건입니다.'; END IF;

    -- Step 1: 신규 시설 생성
    INSERT INTO facilities (
        user_id, name, type, address, phone, verified, status, business_hours, created_at
    )
    VALUES (
        v_inquiry.user_id,
        v_inquiry.company_name,
        CASE
            WHEN v_inquiry.business_type = 'funeral_home' THEN 'funeral_home'
            ELSE 'sangjo'
        END,
        COALESCE(v_inquiry.address, ''),
        COALESCE(v_inquiry.contact_number, ''),
        true,
        'active',
        '{}'::jsonb,
        now()
    ) RETURNING id INTO v_facility_id;

    -- Step 2: partners 테이블 INSERT
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

    -- Step 3: 상조 관련 테이블
    -- ★ 버그 수정: ON CONFLICT (id) DO UPDATE → DO NOTHING
    -- 이미 다른 상조를 관리 중인 사용자의 기존 레코드를 보호
    IF v_inquiry.business_type = 'sangjo_hq' OR v_inquiry.business_type = 'sangjo' THEN
        -- 기존 상조 관리자인지 확인 (경고 로그용)
        SELECT sangjo_id INTO v_existing_sangjo
        FROM sangjo_dashboard_users
        WHERE id = v_inquiry.user_id;

        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_facility_id::text, v_inquiry.company_name, 'hq_admin')
        ON CONFLICT DO NOTHING;

        INSERT INTO sangjo_dashboard_users (id, sangjo_id, role, name)
        VALUES (v_inquiry.user_id, v_facility_id::text, 'admin', v_inquiry.company_name)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Step 4: 신청서 상태 업데이트
    UPDATE partner_inquiries
    SET status = 'approved',
        target_facility_id = v_facility_id::text,
        updated_at = now()
    WHERE id = p_inquiry_id;

    -- Step 5: 동일 업체 다른 pending 신청 자동 거절
    UPDATE partner_inquiries
    SET status = 'rejected',
        message = '[System] 동일 업체 다른 신청이 승인되어 자동 반려됨.',
        updated_at = now()
    WHERE company_name = v_inquiry.company_name
      AND status = 'pending'
      AND id != p_inquiry_id;

    -- Step 6: 유저 프로필 역할 업데이트
    -- ★ super_admin은 절대 덮어쓰지 않음
    UPDATE public.profiles
    SET role = (
        CASE
            WHEN v_inquiry.business_type = 'sangjo_hq' THEN 'sangjo_hq_admin'
            WHEN v_inquiry.business_type = 'sangjo' THEN 'sangjo_user'
            ELSE 'facility_admin'
        END
    )::public.user_role,
    updated_at = now()
    WHERE clerk_id = v_inquiry.user_id
      AND role != 'super_admin'::public.user_role;

    -- Step 7: 감사 로그
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_admin_id, 'APPROVE_PARTNER', 'partner_inquiries', p_inquiry_id::text,
            jsonb_build_object(
                'action_category', 'ADMIN_ACTION',
                'facility_id', v_facility_id,
                'partner_id', v_partner_id,
                'company_name', v_inquiry.company_name,
                'existing_sangjo', v_existing_sangjo,
                'role_assigned', true
            ));

    -- Step 8: 인앱 알림
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
        'action', 'approved',
        'warning', CASE WHEN v_existing_sangjo IS NOT NULL
            THEN '이 사용자는 이미 상조(' || v_existing_sangjo || ')를 관리 중입니다. 기존 매핑이 유지됩니다.'
            ELSE NULL END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
