
-- partner_inquiries 테이블에 business_type 컬럼 추가 (누락된 경우에만)
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS business_type TEXT;

-- 혹시 모를 다른 누락 컬럼들도 안전하게 추가 확인
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS email TEXT;
