-- ============================================================
-- 20260320_fix_user_role_enum.sql
-- user_role enum에 누락된 값 추가
-- 원인: approve_partner_transaction RPC에서 facility_admin, sangjo_user를
--       profiles.role에 할당하는데 enum에 해당 값이 없어서 500 에러 발생
-- ============================================================

-- facility_admin 추가 (장례식장 관리자)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'facility_admin'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE public.user_role ADD VALUE 'facility_admin';
    END IF;
END $$;

-- sangjo_user 추가 (상조 일반 사용자)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'sangjo_user'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE public.user_role ADD VALUE 'sangjo_user';
    END IF;
END $$;

-- 검증
DO $$
DECLARE
    v_values TEXT;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
    INTO v_values
    FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

    RAISE NOTICE 'user_role enum 값: %', v_values;
END $$;
