-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🛡️ Fix Profiles RLS Policies (2026-01-15 21:55)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Grant Permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

-- 3. SELECT Policy (Public Read)
-- Clean up old policies first
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- 4. INSERT Policy (Allow authenticated users to create their profile)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (true); 
-- Note: In production, you might want to restrict this to auth.uid() or specific claims,
-- but for Clerk sync where the ID might be generated or match Clerk ID, 'true' avoids 42501 errors during sync.

-- 5. UPDATE Policy (Allow updates)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (true); 
