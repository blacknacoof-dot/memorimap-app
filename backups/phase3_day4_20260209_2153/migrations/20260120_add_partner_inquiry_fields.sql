-- Add new fields to partner_inquiries table
-- 파일: 20260120_add_partner_inquiry_fields.sql
-- 목적: 파트너 신청 폼 필수 필드 추가

-- ============================================
-- 1. 새 컬럼 추가
-- ============================================

-- 업체 대표 전화번호 (유선)
ALTER TABLE partner_inquiries
ADD COLUMN IF NOT EXISTS company_phone TEXT;

-- 담당자 부서/직급
ALTER TABLE partner_inquiries
ADD COLUMN IF NOT EXISTS manager_position TEXT;

-- 개인정보 수집 및 이용 동의 (필수)
ALTER TABLE partner_inquiries
ADD COLUMN IF NOT EXISTS privacy_consent BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- 2. 컬럼 주석 추가
-- ============================================

COMMENT ON COLUMN partner_inquiries.company_phone IS '업체 대표 전화번호 (유선/고정번호)';
COMMENT ON COLUMN partner_inquiries.manager_position IS '담당자 부서/직급 (예: 관리팀 과장, 대표이사)';
COMMENT ON COLUMN partner_inquiries.privacy_consent IS '개인정보 수집 및 이용 동의 여부 (법적 필수)';

-- ============================================
-- 3. 확인
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Successfully added 3 new columns to partner_inquiries:';
    RAISE NOTICE '  - company_phone (TEXT)';
    RAISE NOTICE '  - manager_position (TEXT)';
    RAISE NOTICE '  - privacy_consent (BOOLEAN NOT NULL)';
END $$;
