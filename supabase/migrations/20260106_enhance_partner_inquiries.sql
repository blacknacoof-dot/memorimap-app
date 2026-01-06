
-- partner_inquiries 테이블에 이메일 ID 및 담당자 휴대폰 컬럼 추가
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS manager_mobile TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS company_email TEXT;

-- company_email은 추후 로그인 ID로 사용되므로 중복 방지를 위한 Unique Index 설정
CREATE UNIQUE INDEX IF NOT EXISTS partner_inquiries_company_email_idx ON public.partner_inquiries (company_email);
