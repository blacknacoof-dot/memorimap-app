-- Add columns to handle more detailed partner inquiries
ALTER TABLE public.partner_inquiries 
ADD COLUMN IF NOT EXISTS message text,
ADD COLUMN IF NOT EXISTS inquiry_type text default 'join', -- 'join' (입점/파트너 신청), 'consult' (1:1 도입 문의)
ADD COLUMN IF NOT EXISTS plan_interest text; -- 관심 있는 플랜명

-- Update existing records to 'join' type by default
UPDATE public.partner_inquiries SET inquiry_type = 'join' WHERE inquiry_type IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.partner_inquiries.message IS '상세 문의 내용';
COMMENT ON COLUMN public.partner_inquiries.inquiry_type IS '문의 분류 (입점신청/도입문의)';
COMMENT ON COLUMN public.partner_inquiries.plan_interest IS '문의 시 선택한 관심 요금제';
