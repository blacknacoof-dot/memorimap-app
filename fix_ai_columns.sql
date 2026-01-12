-- [Fix] Add missing AI columns to memorial_spaces and facilities tables
-- This fixes the 400 Bad Request error when fetching facility info

-- 1. Add columns to memorial_spaces if they don't exist
ALTER TABLE public.memorial_spaces 
ADD COLUMN IF NOT EXISTS ai_context TEXT,
ADD COLUMN IF NOT EXISTS ai_features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_welcome_message TEXT;

-- 2. Add columns to facilities (if used there too)
ALTER TABLE public.facilities 
ADD COLUMN IF NOT EXISTS ai_context TEXT,
ADD COLUMN IF NOT EXISTS ai_features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_welcome_message TEXT;

-- 3. Grant permissions just in case (though RLS should handle it)
GRANT SELECT ON public.memorial_spaces TO anon, authenticated, service_role;
GRANT SELECT ON public.facilities TO anon, authenticated, service_role;

-- 4. Notify to check RLS (This is a comment for the user)
-- Make sure RLS policies allow "Enable read access for all users" or authenticated users.
