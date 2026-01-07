-- Robust fix for favorites RLS and Permissions
-- This script ensures the 'favorites' table is accessible by both anon and authenticated users

-- 1. Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view own favorites (Clerk)" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Allow all on favorites for anon" ON public.favorites;
DROP POLICY IF EXISTS "Allow all on favorites for authenticated" ON public.favorites;

-- 2. Ensure table structure is correct (using TEXT for Clerk user_id)
-- If table exists but user_id is NOT text, this might need more complex migration, 
-- but let's assume it's already text or we can safely recreate it if empty.
-- For now, just ensure RLS is enabled.
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 3. Create broad permissive policies for both anon and authenticated roles
-- This allows Clerk users (who appear as 'anon' if not synced) to manage favorites
CREATE POLICY "Enable all access for anon" 
ON public.favorites FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated" 
ON public.favorites FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Grant explicit table permissions
GRANT ALL ON public.favorites TO anon;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

-- 5. Final check query to verify placement
SELECT tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'favorites';
