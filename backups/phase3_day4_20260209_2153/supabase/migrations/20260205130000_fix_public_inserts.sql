-- ============================================================
-- FIX: Enable Public INSERT for system_logs and leads
-- Priority: High (Required for public forms/logs)
-- ============================================================

-- 1. system_logs
DROP POLICY IF EXISTS "system_logs_insert_anon_and_auth" ON public.system_logs;

CREATE POLICY "system_logs_insert_anon_and_auth"
ON public.system_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Ensure anon has permission at Postgres level
GRANT INSERT ON public.system_logs TO anon;
GRANT INSERT ON public.system_logs TO authenticated;

-- 2. leads
DROP POLICY IF EXISTS "leads_insert_anon_and_auth" ON public.leads;

CREATE POLICY "leads_insert_anon_and_auth"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Ensure anon has permission at Postgres level
GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.leads TO authenticated;
