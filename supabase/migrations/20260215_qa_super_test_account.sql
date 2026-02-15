-- ============================================================
-- QA 슈퍼 테스트 계정 세팅 (한 번에 실행)
-- ============================================================
-- 사용법:
-- 1. Clerk에서 테스트 계정 회원가입
-- 2. Supabase SQL Editor에서 전체 실행
-- 3. 검증 완료 후 하단 CLEANUP 섹션 실행
-- ============================================================

DO $$
DECLARE
    v_clerk_id TEXT := 'user_37p5nXKhEYC4vCk2Q0KTR068KvB';
    v_test_name TEXT := 'QA 슈퍼 테스트';
    v_test_phone TEXT := '010-9999-0000';
    v_facility_id UUID;
    v_partner_id UUID;
BEGIN

    -- ============================================
    -- 1. 프로필 → super_admin 역할 부여
    -- ============================================
    UPDATE profiles
    SET role = 'super_admin', updated_at = now()
    WHERE clerk_id = v_clerk_id;

    RAISE NOTICE '✅ 1/5 프로필 super_admin 설정 완료';

    -- ============================================
    -- 2. 테스트 시설 생성 (시설 관리자 검증용)
    --    이미 존재하면 SKIP
    -- ============================================
    SELECT id INTO v_facility_id
    FROM facilities WHERE user_id = v_clerk_id AND name = 'QA 테스트 장례식장' LIMIT 1;

    IF v_facility_id IS NULL THEN
        INSERT INTO facilities (
            user_id, name, type, address, phone,
            verified, status, business_hours, created_at
        ) VALUES (
            v_clerk_id,
            'QA 테스트 장례식장',
            'funeral_home',
            '서울특별시 강남구 테스트로 123',
            v_test_phone,
            true,
            'active',
            '{"mon":"09:00-18:00","tue":"09:00-18:00","wed":"09:00-18:00","thu":"09:00-18:00","fri":"09:00-18:00"}'::jsonb,
            now()
        ) RETURNING id INTO v_facility_id;
        RAISE NOTICE '✅ 2/5 테스트 시설 생성: %', v_facility_id;
    ELSE
        RAISE NOTICE '✅ 2/5 테스트 시설 이미 존재: %', v_facility_id;
    END IF;

    -- ============================================
    -- 3. 파트너 생성 (상조 대시보드 검증용)
    --    이미 존재하면 SKIP
    -- ============================================
    SELECT id INTO v_partner_id
    FROM partners WHERE name = 'QA 테스트 상조' LIMIT 1;

    IF v_partner_id IS NULL THEN
        INSERT INTO partners (
            name, company_name, status, subscription_plan,
            contact_person, contact_phone, created_at
        ) VALUES (
            'QA 테스트 상조',
            'QA 테스트 상조',
            'approved',
            'basic',
            v_test_name,
            v_test_phone,
            now()
        ) RETURNING id INTO v_partner_id;
        RAISE NOTICE '✅ 3/5 파트너 생성: %', v_partner_id;
    ELSE
        RAISE NOTICE '✅ 3/5 파트너 이미 존재: %', v_partner_id;
    END IF;

    -- ============================================
    -- 4. 상조 대시보드 접근 권한
    -- ============================================
    INSERT INTO sangjo_dashboard_users (id, sangjo_id, role, name)
    VALUES (v_clerk_id, v_partner_id::text, 'admin', v_test_name)
    ON CONFLICT (id) DO UPDATE SET
        sangjo_id = EXCLUDED.sangjo_id,
        role = EXCLUDED.role;

    INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
    VALUES (v_clerk_id, v_partner_id::text, 'QA 테스트 상조', 'hq_admin')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 4/5 상조 대시보드 권한 설정 완료';

    -- ============================================
    -- 5. 구독은 FK 제약 이슈로 SKIP
    --    앱 내 요금제 페이지에서 직접 테스트
    -- ============================================
    RAISE NOTICE '⏭️ 5/5 구독 SKIP (앱에서 직접 테스트)';

    -- ============================================
    -- 결과 요약
    -- ============================================
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎯 QA 슈퍼 테스트 계정 세팅 완료!';
    RAISE NOTICE '  Clerk ID:    %', v_clerk_id;
    RAISE NOTICE '  역할:        super_admin';
    RAISE NOTICE '  시설 UUID:   %', v_facility_id;
    RAISE NOTICE '  파트너 UUID: %', v_partner_id;
    RAISE NOTICE '========================================';

END $$;


-- ============================================================
-- 🧹 CLEANUP (검증 완료 후 아래만 별도 실행)
-- ============================================================
-- 20260215_qa_cleanup.sql 파일로 분리됨
