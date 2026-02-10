-- 1. Add target_brand_id column to handle Sangjo company IDs (strings)
ALTER TABLE public.partner_inquiries ADD COLUMN IF NOT EXISTS target_brand_id text;

-- 2. Cleanup Duplicates: Keep only the latest inquiry per user_id
-- This allows the UNIQUE constraint to be created without error.
DELETE FROM public.partner_inquiries
WHERE id NOT IN (
    SELECT MAX(id)
    FROM public.partner_inquiries
    WHERE user_id IS NOT NULL
    GROUP BY user_id
) AND user_id IS NOT NULL;

-- 3. Add unique constraint on user_id to limit to one inquiry per user
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partner_inquiries_user_id_key') THEN
    ALTER TABLE public.partner_inquiries ADD CONSTRAINT partner_inquiries_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN public.partner_inquiries.target_brand_id IS 'Stored ID for brands/sangjo companies (from FUNERAL_COMPANIES constant)';
