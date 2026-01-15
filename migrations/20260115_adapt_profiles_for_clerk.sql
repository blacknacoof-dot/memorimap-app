-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🛠️ Fix Profiles for Clerk Auth (2026-01-15 21:50)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Drop Foreign Key Constraint to auth.users (Since Clerk users don't exist in auth.users)
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
    AND confrelid = 'auth.users'::regclass
    AND contype = 'f';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- 2. Allow auto-generation of IDs (Since Clerk doesn't provide UUIDs for INSERT)
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Add clerk_id column for syncing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- 4. Create Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON public.profiles(clerk_id);

-- 5. Grant permissions if needed (usually handled by RLS but good to be safe)
GRANT ALL ON public.profiles TO authenticated, service_role;
GRANT SELECT ON public.profiles TO anon;
