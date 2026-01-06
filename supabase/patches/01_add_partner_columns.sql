
-- [Partner Inquiries] ?µí•© ?¤í‚¤ë§?ë³´ê°• ?¤í¬ë¦½íŠ¸
-- ?„ë½??ëª¨ë“  ì»¬ëŸ¼????ë²ˆì— ?•ì¸?˜ê³  ì¶”ê??©ë‹ˆ??

-- 1. ?µì‹¬ ?„ë“œ (ë¹„ì¦ˆ?ˆìŠ¤ ë¡œì§ ?„ìˆ˜)
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS manager_mobile TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS company_email TEXT;

-- 2. ê¸°ë³¸ ?•ë³´ ?„ë“œ (?ˆì „ ?¥ì¹˜)
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS business_license_url TEXT;

-- 3. ë¹„ë¡œê·¸ì¸ ?ˆìš© ?¤ì • (?´ë? ?˜ì–´?ˆì„ ???ˆìŒ)
ALTER TABLE public.partner_inquiries ALTER COLUMN user_id DROP NOT NULL;

-- 4. Unique Index (ì¤‘ë³µ ? ì²­/ID ë°©ì?)
CREATE UNIQUE INDEX IF NOT EXISTS partner_inquiries_company_email_idx ON public.partner_inquiries (company_email);
