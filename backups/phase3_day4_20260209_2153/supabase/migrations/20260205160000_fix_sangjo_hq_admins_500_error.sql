BEGIN;

-- =============================================
-- RLS Fix for Admin Tables (Final V2)
-- =============================================
-- Issue: current_setting('request.jwt.claims') is unreliable in some contexts.
-- Fix: Use auth.jwt() ->> 'sub' directly which calls the internal function.

-- 1. sangjo_hq_admins
DROP POLICY IF EXISTS "sangjo_admin_select_clerk" ON sangjo_hq_admins;
DROP POLICY IF EXISTS "sangjo_admin_select_own" ON sangjo_hq_admins;

CREATE POLICY "sangjo_admin_select_clerk_fixed" ON sangjo_hq_admins
  FOR SELECT TO authenticated
  USING (
    user_id = COALESCE(
      auth.jwt() ->> 'sub',
      auth.uid()::text
    )
  );

-- 2. facility_admins
DROP POLICY IF EXISTS "facility_admin_select_clerk" ON facility_admins;
DROP POLICY IF EXISTS "facility_admin_select_own" ON facility_admins;

CREATE POLICY "facility_admin_select_clerk_fixed" ON facility_admins
  FOR SELECT TO authenticated
  USING (
    user_id = COALESCE(
      auth.jwt() ->> 'sub',
      auth.uid()::text
    )
  );

COMMIT;
