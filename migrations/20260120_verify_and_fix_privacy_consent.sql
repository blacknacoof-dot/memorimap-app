-- Verify and Force Fix privacy_consent column
-- 파일: 20260120_verify_and_fix_privacy_consent.sql
-- 목적: privacy_consent 컬럼 상태 확인 및 강제 수정

-- ============================================
-- 1. 현재 상태 확인
-- ============================================

-- 컬럼 정보 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'partner_inquiries'
AND column_name = 'privacy_consent';

-- ============================================
-- 2. 강제 수정
-- ============================================

-- NOT NULL 제약이 여전히 있다면 강제 제거
ALTER TABLE partner_inquiries
ALTER COLUMN privacy_consent DROP NOT NULL;

-- DEFAULT 값 명시적으로 설정
ALTER TABLE partner_inquiries
ALTER COLUMN privacy_consent SET DEFAULT false;

-- ============================================
-- 3. 최종 확인
-- ============================================

-- 수정 후 다시 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'partner_inquiries'
AND column_name = 'privacy_consent';

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'privacy_consent column verification complete';
    RAISE NOTICE 'Expected: is_nullable = YES';
    RAISE NOTICE 'Expected: column_default = false';
    RAISE NOTICE '===========================================';
END $$;
