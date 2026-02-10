BEGIN;

-- =============================================
-- RLS Fix for Profiles Table
-- =============================================
-- Issue: 500 Error due to unreliable access to Clerk ID in RLS policies
-- Fix: Use auth.jwt() ->> 'sub' directly

-- 1. SELECT
DROP POLICY IF EXISTS "profiles_select_by_clerk" ON public.profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON public.profiles;

CREATE POLICY "profiles_select_by_clerk_fixed" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    clerk_id = auth.jwt()->>'sub'
    OR (auth.jwt()->>'role')::text = 'super_admin'
  );

-- 2. UPDATE
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own_fixed" ON public.profiles
  FOR UPDATE TO authenticated
  USING (clerk_id = auth.jwt()->>'sub')
  WITH CHECK (clerk_id = auth.jwt()->>'sub');

-- 3. INSERT
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_insert_own_fixed" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (clerk_id = auth.jwt()->>'sub');

COMMIT;
