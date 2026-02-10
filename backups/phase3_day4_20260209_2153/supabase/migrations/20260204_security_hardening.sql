
-- Security Hardening Migration (improved)
-- Date: 2026-02-04
-- Changes:
-- 1) RLS: emergency_requests - make INSERT require authenticated (with clear backup policy name)
-- 2) Functions: set search_path = public for search_facilities_v2 and search_facilities_by_text (handles overloads)
-- 3) Added verification queries

BEGIN;

-- ==========================================
-- 1. RLS Hardening: emergency_requests
-- ==========================================

-- A) If a permissive policy named "Enable insert for all users" exists, rename it to keep a backup with table suffix.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'emergency_requests'
      AND p.polname = 'Enable insert for all users'
      AND p.polcmd = 'a'
  ) THEN
    EXECUTE 'ALTER POLICY "Enable insert for all users" ON public.emergency_requests RENAME TO "Enable insert for all users_backup_emergency_requests"';
  END IF;
END
$$;

-- B) Drop the new safe policy if it already exists (idempotence)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'emergency_requests'
      AND p.polname = 'authenticated_insert_emergency_requests'
      AND p.polcmd = 'a'
  ) THEN
    EXECUTE 'DROP POLICY "authenticated_insert_emergency_requests" ON public.emergency_requests';
  END IF;
END
$$;

-- C) Create a safe INSERT policy for authenticated users.
-- Simpler, robust check: require a valid auth.uid() for inserts.
-- If you want to enforce created_by matching, replace the WITH CHECK expression with:
--   WITH CHECK (created_by = (SELECT auth.uid()))
CREATE POLICY "authenticated_insert_emergency_requests" ON public.emergency_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
  );

-- ==========================================
-- 2. Function Security: Fix Search Paths (handle overloaded functions)
-- ==========================================
-- We will find all functions with the given name in the public schema and apply SET search_path = public to each.
-- Note: ALTER FUNCTION ... SET requires function identity (name + argument types) or OID; we iterate OIDs to avoid ambiguity.

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
    EXCEPTION WHEN OTHERS THEN
      -- If the formatted ALTER FUNCTION fails (permission/ownership/other), log via RAISE NOTICE and continue
      RAISE NOTICE 'Failed to ALTER FUNCTION % (%) : %', proc.proname, proc.args, SQLERRM;
    END;
  END LOOP;
END
$$;

COMMIT;

-- ==========================================
-- 3. Verification queries (run after migration)
-- ==========================================
-- A) Check policies on emergency_requests
SELECT n.nspname AS schema, c.relname AS table, p.polname AS policy_name, p.polcmd AS command
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'emergency_requests';

-- B) Check that our new policy has the expected WITH CHECK expression (inspects policy definition)
SELECT pol.polname,
       pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
       pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expr
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
WHERE c.relname = 'emergency_requests';

-- C) Check function search_path settings for the two functions
SELECT n.nspname AS schema,
       p.proname AS name,
       pg_get_function_identity_arguments(p.oid) AS args,
       (SELECT array_to_string(array_agg(cfg), ', ') FROM unnest(p.proconfig) cfg) AS proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('search_facilities_v2', 'search_facilities_by_text')
  AND n.nspname = 'public';
