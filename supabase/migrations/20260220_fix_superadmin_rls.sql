-- ============================================
-- Fix: SuperAdmin Dashboard RLS errors
-- Date: 2026-02-20
-- Issues:
--   1. audit_logs SELECT → 22P02 (auth.uid() UUID cast fails with Clerk ID)
--   2. notices INSERT → 42501 (RLS blocks super admin)
--   3. profiles SELECT → 400 (possible auth.uid() in leftover policy)
-- ============================================

-- ────────────────────────────────────────────
-- HELPER: Ensure clerk_user_id() function exists
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    ''
  );
$$;

-- ────────────────────────────────────────────
-- HELPER: is_super_admin check function
-- Uses profiles table (consistent with 20260220_fix_is_super_admin_function.sql)
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = public.clerk_user_id()
      AND role = 'super_admin'
  );
END;
$$;

-- ════════════════════════════════════════════
-- 1. AUDIT_LOGS
-- ════════════════════════════════════════════
-- Drop ALL existing policies dynamically
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON audit_logs';
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can read all audit logs
CREATE POLICY "audit_logs_super_admin_select" ON audit_logs
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- Service role can insert (from edge functions, triggers)
-- (service_role bypasses RLS by default, but explicit for clarity)
CREATE POLICY "audit_logs_service_insert" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

-- ════════════════════════════════════════════
-- 2. NOTICES
-- ════════════════════════════════════════════
-- Drop ALL existing policies dynamically
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notices') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON notices';
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Everyone can read notices (public)
CREATE POLICY "notices_public_select" ON notices
  FOR SELECT TO public
  USING (true);

-- Super admins can create/update/delete notices
CREATE POLICY "notices_super_admin_insert" ON notices
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "notices_super_admin_update" ON notices
  FOR UPDATE TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "notices_super_admin_delete" ON notices
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- ════════════════════════════════════════════
-- 3. PROFILES - cleanup leftover auth.uid() policies
-- ════════════════════════════════════════════
-- Drop ALL existing policies and recreate clean ones
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles
CREATE POLICY "profiles_public_select" ON profiles
  FOR SELECT TO public
  USING (true);

-- Authenticated users can insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (clerk_id = public.clerk_user_id());

-- Authenticated users can update their own profile (with role escalation prevention)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (clerk_id = public.clerk_user_id())
  WITH CHECK (
    clerk_id = public.clerk_user_id()
    AND (role IS NOT DISTINCT FROM (SELECT p.role FROM profiles p WHERE p.clerk_id = public.clerk_user_id()))
  );

-- Super admins can manage all profiles
CREATE POLICY "profiles_super_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ════════════════════════════════════════════
-- VERIFY
-- ════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: audit_logs, notices, profiles RLS policies updated';
  RAISE NOTICE 'All policies now use clerk_user_id() instead of auth.uid()';
END $$;
