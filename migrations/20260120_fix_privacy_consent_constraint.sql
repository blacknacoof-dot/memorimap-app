-- Hotfix: Remove NOT NULL constraint from privacy_consent
-- 파일: 20260120_fix_privacy_consent_constraint.sql
-- 목적: privacy_consent NOT NULL 제약 제거 (UI에서 검증)

-- ============================================
-- 1. NOT NULL 제약 제거
-- ============================================

ALTER TABLE partner_inquiries
ALTER COLUMN privacy_consent DROP NOT NULL;

-- ============================================
-- 2. DEFAULT 값 유지 확인
-- ============================================

-- DEFAULT false는 유지 (이미 설정됨)
-- UI에서 체크박스 필수 검증으로 처리

-- ============================================
-- 3. 확인
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'privacy_consent column constraint updated:';
    RAISE NOTICE '  - NOT NULL constraint removed';
    RAISE NOTICE '  - DEFAULT false maintained';
    RAISE NOTICE '  - UI validation enforces required checkbox';
END $$;
