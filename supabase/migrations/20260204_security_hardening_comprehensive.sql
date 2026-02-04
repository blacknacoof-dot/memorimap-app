
-- Comprehensive Security Hardening Migration (Final Explicit Version)
-- Date: 2026-02-04
-- Context: Hardening RLS policies for multiple tables.
-- Approach: Explicit DROP + CREATE per table for maximum reliability.

BEGIN;

-------------------------------------------------------------------------------
-- 1. UTILS (Search Path Fix for Functions)
-------------------------------------------------------------------------------
DO $$
DECLARE
  proc RECORD;
BEGIN
  FOR proc IN
    SELECT p.oid, n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname IN ('search_facilities_v2', 'search_facilities_by_text')
      AND n.nspname = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', proc.proname, proc.args);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipped ALTER FUNCTION %: %', proc.proname, SQLERRM;
    END;
  END LOOP;
END
$$;

-------------------------------------------------------------------------------
-- 2. chat_events (user_id: uuid)
-------------------------------------------------------------------------------
DO $$
DECLARE
  rec record;
BEGIN
  -- Drop existing INSERT policies
  FOR rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_events' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.chat_events', rec.policyname);
  END LOOP;

  -- Create safe policy
  CREATE POLICY chat_events_insert_owner_only
    ON public.chat_events
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
END $$;

-------------------------------------------------------------------------------
-- 3. consultations (user_id: text)
-------------------------------------------------------------------------------
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'consultations' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.consultations', rec.policyname);
  END LOOP;

  CREATE POLICY consultations_insert_owner_only
    ON public.consultations
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid())::text = user_id);
END $$;

-------------------------------------------------------------------------------
-- 4. emergency_requests (No user_id - Authenticated only)
-------------------------------------------------------------------------------
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'emergency_requests' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.emergency_requests', rec.policyname);
  END LOOP;

  CREATE POLICY emergency_requests_insert_auth_only
    ON public.emergency_requests
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
END $$;

-------------------------------------------------------------------------------
-- 5. leads (user_id: text)
-------------------------------------------------------------------------------
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leads' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.leads', rec.policyname);
  END LOOP;

  CREATE POLICY leads_insert_owner_only
    ON public.leads
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid())::text = user_id);
END $$;

-------------------------------------------------------------------------------
-- 6. product_click_logs (user_id: uuid)
-------------------------------------------------------------------------------
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'product_click_logs' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.product_click_logs', rec.policyname);
  END LOOP;

  CREATE POLICY product_click_logs_insert_owner_only
    ON public.product_click_logs
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
END $$;

-------------------------------------------------------------------------------
-- 7. system_logs (No user_id - Authenticated only)
-------------------------------------------------------------------------------
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'system_logs' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.system_logs', rec.policyname);
  END LOOP;

  CREATE POLICY system_logs_insert_auth_only
    ON public.system_logs
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
END $$;

COMMIT;

-- VERIFICATION
SELECT schemaname, tablename, policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename IN ('chat_events', 'consultations', 'emergency_requests', 'leads', 'product_click_logs', 'system_logs')
ORDER BY tablename;
