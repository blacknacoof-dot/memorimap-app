-- Fix admin_users RLS policy: auth.uid() → clerk_user_id()
-- admin_select_own policy from 20260205101500_emergency_rls_fix.sql used auth.uid()
-- which causes 22P02 UUID cast error with Clerk user IDs

DROP POLICY IF EXISTS "admin_select_own" ON admin_users;

CREATE POLICY "admin_select_own" ON admin_users
  FOR SELECT TO authenticated
  USING (user_id = public.clerk_user_id());
