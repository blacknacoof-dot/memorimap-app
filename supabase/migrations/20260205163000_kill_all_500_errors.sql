-- =============================================
-- KILL ALL 500 ERRORS - Clerk RLS Harmonization (V2 - Permission Fix)
-- =============================================
-- Issue: 500 errors due to invalid UUID casts
-- Fix: Use direct (auth.jwt() ->> 'sub') and remove ::uuid casts for Clerk IDs
-- Note: Function creation in auth schema removed to avoid permission errors

BEGIN;

-- 1. PROFILES Table Fix
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_anon" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_modify_own" ON public.profiles;

-- Simplified policies for profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO public
  USING (true); -- Everyone can read profiles

CREATE POLICY "profiles_modify_own" ON public.profiles
  FOR ALL TO authenticated
  USING (clerk_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (clerk_id = (auth.jwt() ->> 'sub'));

-- 2. FACILITIES Table Fix
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read facilities" ON public.facilities;
DROP POLICY IF EXISTS "public_read_facilities" ON public.facilities;
DROP POLICY IF EXISTS "facilities_public_read" ON public.facilities;

-- Public READ
CREATE POLICY "facilities_public_read" ON public.facilities
  FOR SELECT TO public
  USING (true);

-- Admin Modify (via facility_admins)
-- IMPORTANT: REMOVE ::uuid casts here!
DROP POLICY IF EXISTS "facility_admin_modify" ON public.facilities;
CREATE POLICY "facility_admin_modify" ON public.facilities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_admins 
      WHERE facility_id::text = facilities.id::text 
      AND user_id = (auth.jwt() ->> 'sub')
    )
  );

-- 3. SANGJO_HQ_ADMINS Table Fix
ALTER TABLE public.sangjo_hq_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sangjo_admin_select_clerk_fixed" ON public.sangjo_hq_admins;
DROP POLICY IF EXISTS "sangjo_admin_select_clerk" ON public.sangjo_hq_admins;
DROP POLICY IF EXISTS "sangjo_admin_select_own" ON public.sangjo_hq_admins;
DROP POLICY IF EXISTS "sangjo_admin_policy" ON public.sangjo_hq_admins;

CREATE POLICY "sangjo_admin_policy" ON public.sangjo_hq_admins
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- 4. FACILITY_ADMINS Table Fix
ALTER TABLE public.facility_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facility_admin_select_clerk_fixed" ON public.facility_admins;
DROP POLICY IF EXISTS "facility_admin_select_clerk" ON public.facility_admins;
DROP POLICY IF EXISTS "facility_admin_select_own" ON public.facility_admins;
DROP POLICY IF EXISTS "facility_admin_policy" ON public.facility_admins;

CREATE POLICY "facility_admin_policy" ON public.facility_admins
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- 5. Give permissions
GRANT ALL ON public.profiles TO authenticated, service_role;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.facilities TO authenticated, service_role;
GRANT SELECT ON public.facilities TO anon;
GRANT ALL ON public.sangjo_hq_admins TO authenticated, service_role;
GRANT ALL ON public.facility_admins TO authenticated, service_role;

COMMIT;
