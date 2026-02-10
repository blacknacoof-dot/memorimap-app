
-- [Admin Prep] 파트너 관리 및 승인 기능을 위한 최종 테이블 점검
-- 이 스크립트는 누락된 컬럼을 추가하여 '파트너 신청' 및 '승인' 기능이 100% 작동하도록 보장합니다.

-- 1. [Partner Inquiries] 신청서 테이블 보강
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS manager_mobile TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS business_license_url TEXT;

-- 비로그인 신청 허용
ALTER TABLE public.partner_inquiries ALTER COLUMN user_id DROP NOT NULL;

-- 2. [Facilities] 시설 테이블 보강 (승인 시 insert 될 컬럼들)
-- 혹시 모를 테이블명 혼동(facilities vs memorial_spaces)을 대비해 둘 다 체크합니다.

DO $$ 
BEGIN 
  -- A. facilities 테이블 체크
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facilities') THEN
    ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS contact TEXT;
    ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS category TEXT;
  END IF;
  
  -- B. memorial_spaces 테이블 체크 (만약 facilities가 View라면 원본에 추가됨)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'memorial_spaces') THEN
    ALTER TABLE public.memorial_spaces ADD COLUMN IF NOT EXISTS contact TEXT;
    ALTER TABLE public.memorial_spaces ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.memorial_spaces ADD COLUMN IF NOT EXISTS category TEXT;
  END IF;
END $$;
