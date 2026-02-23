-- ============================================
-- Fix: is_super_admin() was checking admin_users (wrong table)
-- Must check profiles.role = 'super_admin' to match the p_user_id overload
-- Date: 2026-02-20
-- ============================================

-- Fix the no-param version (used by RLS policies)
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

-- Ensure grants
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon;

DO $$ BEGIN RAISE NOTICE 'Fix applied: is_super_admin() now checks profiles table'; END $$;
