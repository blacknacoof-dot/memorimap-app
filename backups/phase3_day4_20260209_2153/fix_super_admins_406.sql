-- [Fix] 406 Not Acceptable Error for super_admins
-- This script ensures the table exists, has proper RLS, and grants necessary permissions.

-- 1. Create Table (if not exists)
CREATE TABLE IF NOT EXISTS public.super_admins (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Grant Permissions (CRITICAL for 406/401 errors)
-- RLS doesn't work if the role doesn't have TABLE permissions first.
GRANT SELECT ON public.super_admins TO anon;
GRANT SELECT ON public.super_admins TO authenticated;
GRANT SELECT ON public.super_admins TO service_role;

-- 3. Setup RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policy to avoid conflict/duplication
DROP POLICY IF EXISTS "Public read for super_admins" ON public.super_admins;

-- Create Policy
CREATE POLICY "Public read for super_admins" 
ON public.super_admins 
FOR SELECT 
TO public 
USING (true);

-- 4. Insert Current User (Optional, but good for testing)
-- User ID from logs: user_36vml1WCaPN5YGZFA84gzmgDHAW
INSERT INTO public.super_admins (id) 
VALUES ('user_36vml1WCaPN5YGZFA84gzmgDHAW')
ON CONFLICT (id) DO NOTHING;

-- Verification: Check if it exists
SELECT * FROM public.super_admins WHERE id = 'user_36vml1WCaPN5YGZFA84gzmgDHAW';
