
-- [Partner Inquiries] 통합 스키마 보강 스크립트
-- 누락된 모든 컬럼을 한 번에 확인하고 추가합니다.

-- 1. 핵심 필드 (비즈니스 로직 필수)
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS manager_mobile TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS company_email TEXT;

-- 2. 기본 정보 필드 (안전 장치)
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS business_license_url TEXT;

-- 3. 비로그인 허용 설정 (이미 되어있을 수 있음)
ALTER TABLE public.partner_inquiries ALTER COLUMN user_id DROP NOT NULL;

-- 4. Unique Index (중복 신청/ID 방지)
CREATE UNIQUE INDEX IF NOT EXISTS partner_inquiries_company_email_idx ON public.partner_inquiries (company_email);
