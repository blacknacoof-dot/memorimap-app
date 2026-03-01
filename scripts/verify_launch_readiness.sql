-- =============================================
-- 출시 준비 검증 스크립트
-- 마이그레이션 실행 후 이 스크립트로 무결성 확인
-- =============================================

-- 1. 필수 테이블 존재 확인
DO $$
DECLARE
    v_tables TEXT[] := ARRAY[
        'profiles', 'facilities', 'partners', 'partner_inquiries',
        'consultations', 'reservations', 'favorites', 'sangjo_favorites',
        'sangjo_contracts', 'sangjo_contract_timeline', 'sangjo_dashboard_users',
        'sangjo_hq_admins', 'audit_logs', 'system_logs', 'user_notifications',
        'platform_notices', 'notices', 'system_settings', 'leads',
        'facility_scenarios', 'facility_subscriptions', 'subscription_payments',
        'subscription_plans', 'partner_conversations', 'partner_operations',
        'user_ending_notes', 'facility_reviews'
    ];
    v_table TEXT;
    v_missing TEXT[] := '{}';
BEGIN
    FOREACH v_table IN ARRAY v_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = v_table
        ) THEN
            v_missing := array_append(v_missing, v_table);
        END IF;
    END LOOP;

    IF array_length(v_missing, 1) > 0 THEN
        RAISE WARNING '누락 테이블: %', array_to_string(v_missing, ', ');
    ELSE
        RAISE NOTICE '모든 필수 테이블 존재 확인 OK';
    END IF;
END $$;

-- 2. RLS 활성화 확인
DO $$
DECLARE
    v_no_rls TEXT[] := '{}';
    v_rec RECORD;
BEGIN
    FOR v_rec IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN (
            'profiles', 'facilities', 'partners', 'partner_inquiries',
            'consultations', 'reservations', 'favorites', 'sangjo_favorites',
            'sangjo_contracts', 'sangjo_contract_timeline', 'sangjo_dashboard_users',
            'audit_logs', 'system_logs', 'user_notifications', 'notices',
            'system_settings', 'leads', 'facility_scenarios'
          )
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class
            WHERE relname = v_rec.tablename AND relrowsecurity = true
        ) THEN
            v_no_rls := array_append(v_no_rls, v_rec.tablename);
        END IF;
    END LOOP;

    IF array_length(v_no_rls, 1) > 0 THEN
        RAISE WARNING 'RLS 미활성 테이블: %', array_to_string(v_no_rls, ', ');
    ELSE
        RAISE NOTICE 'RLS 전체 활성화 OK';
    END IF;
END $$;

-- 3. 핵심 RPC 함수 존재 확인
DO $$
DECLARE
    v_missing TEXT[] := '{}';
BEGIN
    -- is_super_admin() 무인자
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'is_super_admin'
          AND p.pronargs = 0
    ) THEN
        v_missing := array_append(v_missing, 'is_super_admin()');
    END IF;

    -- is_super_admin(TEXT) 파라미터
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'is_super_admin'
          AND p.pronargs = 1
    ) THEN
        v_missing := array_append(v_missing, 'is_super_admin(TEXT)');
    END IF;

    -- clerk_user_id()
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'clerk_user_id'
    ) THEN
        v_missing := array_append(v_missing, 'clerk_user_id()');
    END IF;

    -- approve_partner_transaction
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'approve_partner_transaction'
    ) THEN
        v_missing := array_append(v_missing, 'approve_partner_transaction()');
    END IF;

    -- search_facilities_in_view
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'search_facilities_in_view'
    ) THEN
        v_missing := array_append(v_missing, 'search_facilities_in_view()');
    END IF;

    IF array_length(v_missing, 1) > 0 THEN
        RAISE WARNING '누락 함수: %', array_to_string(v_missing, ', ');
    ELSE
        RAISE NOTICE '핵심 RPC 함수 전체 존재 OK';
    END IF;
END $$;

-- 4. admin_subscriptions_with_facility VIEW 존재 확인
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'admin_subscriptions_with_facility'
    ) THEN
        RAISE WARNING 'VIEW 누락: admin_subscriptions_with_facility';
    ELSE
        RAISE NOTICE 'admin_subscriptions_with_facility VIEW 존재 OK';
    END IF;
END $$;

-- 5. 슈퍼관리자 계정 확인
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.profiles
    WHERE role = 'super_admin';

    IF v_count = 0 THEN
        RAISE WARNING '슈퍼관리자 계정이 없습니다! profiles.role = super_admin 레코드 0건';
    ELSE
        RAISE NOTICE '슈퍼관리자 계정 %건 확인 OK', v_count;
    END IF;
END $$;

-- 6. partners.id DEFAULT 설정 확인
DO $$
DECLARE
    v_default TEXT;
BEGIN
    SELECT column_default INTO v_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'id';

    IF v_default IS NULL THEN
        RAISE WARNING 'partners.id에 DEFAULT가 없습니다!';
    ELSE
        RAISE NOTICE 'partners.id DEFAULT: %', v_default;
    END IF;
END $$;

-- 7. approve_partner_transaction의 v_partner_id 타입 확인
DO $$
DECLARE
    v_src TEXT;
BEGIN
    SELECT prosrc INTO v_src
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'approve_partner_transaction';

    IF v_src LIKE '%v_partner_id UUID%' THEN
        RAISE WARNING 'approve_partner_transaction에서 v_partner_id가 UUID 타입입니다! TEXT여야 합니다.';
    ELSIF v_src LIKE '%v_partner_id TEXT%' THEN
        RAISE NOTICE 'approve_partner_transaction v_partner_id TEXT 타입 OK';
    ELSE
        RAISE NOTICE 'approve_partner_transaction 함수 소스를 수동 확인하세요';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '검증 완료. WARNING이 있으면 해당 항목을 수정하세요.';
    RAISE NOTICE '========================================';
END $$;
