-- =============================================
-- RLS DIAGNOSTIC & ULTIMATE RECOVERY
-- =============================================
-- Purpose: 
-- 1. Check if tables and columns exist
-- 2. Wipe ALL policies to prevent recursion
-- 3. Set up the most robust Clerk-compatible policies
-- 4. Use raw current_setting instead of auth.jwt() for maximum compatibility

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 1. Wipe all known policies to prevent recursion
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'facilities', 'facility_admins', 'sangjo_hq_admins', 'sangjo_users')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. Verify column existence and fix if necessary
-- For profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'clerk_id') THEN
        ALTER TABLE public.profiles ADD COLUMN clerk_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- For facilities
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facilities' AND column_name = 'user_id') THEN
        ALTER TABLE public.facilities ADD COLUMN user_id TEXT; -- For Clerk ID storage
    END IF;
END $$;

-- 3. APPLY ULTIMATE ROBUST POLICIES (No auth.jwt() function dependency)
-- Use: (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "robust_profiles_select" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "robust_profiles_all" ON public.profiles FOR ALL TO authenticated 
  USING (clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'))
  WITH CHECK (clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- FACILITIES
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "robust_facilities_select" ON public.facilities FOR SELECT TO public USING (true);
CREATE POLICY "robust_facilities_modify" ON public.facilities FOR ALL TO authenticated 
  USING (
    user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    OR 
    EXISTS (
      SELECT 1 FROM public.facility_admins 
      WHERE facility_id::text = facilities.id::text 
      AND user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
  );

-- FACILITY_ADMINS
ALTER TABLE public.facility_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "robust_facility_admins_select" ON public.facility_admins FOR SELECT TO public USING (true);
CREATE POLICY "robust_facility_admins_all" ON public.facility_admins FOR ALL TO authenticated 
  USING (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'))
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- SANGJO_HQ_ADMINS
ALTER TABLE public.sangjo_hq_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "robust_sangjo_hq_admins_select" ON public.sangjo_hq_admins FOR SELECT TO public USING (true);
CREATE POLICY "robust_sangjo_hq_admins_all" ON public.sangjo_hq_admins FOR ALL TO authenticated 
  USING (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'))
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- 4. FIX get_user_role if it exists (recursion prevention)
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE clerk_id = p_user_id OR id::text = p_user_id LIMIT 1);
END;
$$;

-- 5. FINAL GRANTS
GRANT ALL ON public.profiles TO authenticated, service_role;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.facilities TO authenticated, service_role;
GRANT SELECT ON public.facilities TO anon;
GRANT ALL ON public.facility_admins TO authenticated, service_role;
GRANT SELECT ON public.facility_admins TO anon;
GRANT ALL ON public.sangjo_hq_admins TO authenticated, service_role;
GRANT SELECT ON public.sangjo_hq_admins TO anon;

SELECT 'RLS Diagnostic & Recovery completed. Please test now.' as message;
