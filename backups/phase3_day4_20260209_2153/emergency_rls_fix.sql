-- Emergency RLS Fix for 401 Unauthorized Errors
-- Fixes: system_logs and leads table insert permissions
-- Date: 2026-02-05

BEGIN;

-- 1. Fix system_logs - Allow anon users to insert (for client-side logging)
DROP POLICY IF EXISTS system_logs_insert_auth_only ON public.system_logs;
DROP POLICY IF EXISTS "Anonymous users can insert logs" ON public.system_logs;

CREATE POLICY system_logs_insert_anon_and_auth
  ON public.system_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT INSERT ON public.system_logs TO anon;
GRANT INSERT ON public.system_logs TO authenticated;

-- 2. Fix leads - Allow anon users to insert leads (for guest inquiries)
DROP POLICY IF EXISTS leads_insert_owner_only ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;

CREATE POLICY leads_insert_anon_and_auth
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anon to insert leads
GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.leads TO authenticated;

COMMIT;

-- Verification
SELECT schemaname, tablename, policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename IN ('system_logs', 'leads')
ORDER BY tablename;
