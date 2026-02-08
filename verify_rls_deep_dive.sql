-- ============================================================
-- Deep Dive RLS Investigation Queries
-- Based on Initial Audit Findings
-- ============================================================

-- 1. CHECK FOR ALWAYS-TRUE POLICIES (CRITICAL SECURITY RISK)
-- These policies allow unrestricted access
SELECT 
    tablename,
    policyname,
    cmd,
    qual as "USING expression",
    with_check as "WITH CHECK expression"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND (qual = 'true' OR qual IS NULL OR qual = '(true)')
ORDER BY tablename, cmd;

-- 2. ADMIN TABLE POLICIES DETAILED REVIEW
-- Verify admin tables have proper ownership checks
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as "USING expression",
    with_check as "WITH CHECK expression"
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%admin%' 
    OR tablename LIKE 'super_%'
    OR tablename = 'facility_admins'
    OR tablename = 'sangjo_hq_admins'
  )
ORDER BY tablename, cmd;

-- 3. BACKUP TABLE POLICIES
-- These should ideally be removed or restricted to service_role
SELECT 
    tablename,
    policyname,
    roles,
    cmd,
    qual as "USING expression"
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE '%backup%'
ORDER BY tablename;

-- 4. SINGLE-POLICY TABLES (INCOMPLETE COVERAGE)
-- Identify tables that might need additional policies
WITH policy_counts AS (
  SELECT 
    tablename,
    COUNT(*) as policy_count,
    array_agg(cmd::text) as commands
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
    pc.tablename,
    pc.policy_count,
    pc.commands,
    CASE 
      WHEN 'SELECT' = ANY(pc.commands) THEN '✓' ELSE '✗'
    END as has_select,
    CASE 
      WHEN 'INSERT' = ANY(pc.commands) THEN '✓' ELSE '✗'
    END as has_insert,
    CASE 
      WHEN 'UPDATE' = ANY(pc.commands) THEN '✓' ELSE '✗'
    END as has_update,
    CASE 
      WHEN 'DELETE' = ANY(pc.commands) THEN '✓' ELSE '✗'
    END as has_delete
FROM policy_counts pc
WHERE pc.policy_count = 1
ORDER BY pc.tablename;

-- 5. TABLES WITH MISSING UPDATE/DELETE POLICIES
-- Tables that allow INSERT but not UPDATE/DELETE
WITH policy_commands AS (
  SELECT 
    tablename,
    array_agg(cmd::text) as commands
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
)
SELECT 
    tablename,
    commands
FROM policy_commands
WHERE 
  'INSERT' = ANY(commands)
  AND NOT ('UPDATE' = ANY(commands) OR 'DELETE' = ANY(commands) OR 'ALL' = ANY(commands))
ORDER BY tablename;

-- 6. PUBLICLY ACCESSIBLE POLICIES (NO AUTH CHECK)
-- Policies that don't check auth.uid() or auth.role()
SELECT 
    tablename,
    policyname,
    cmd,
    qual as "USING expression"
FROM pg_policies 
WHERE schemaname = 'public'
  AND qual NOT LIKE '%auth.%'
  AND qual NOT LIKE '%current_setting%'
  AND cmd IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
ORDER BY tablename, cmd;

-- 7. POLICY ROLE ASSIGNMENTS
-- Check which database roles have access
SELECT 
    tablename,
    cmd,
    unnest(roles::text[]) as role_name,
    COUNT(*) OVER (PARTITION BY tablename) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 8. TABLES WITH RLS ENABLED BUT NO POLICIES
-- Critical: RLS on with no policies = total lockout
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND p.policyname IS NULL
ORDER BY t.tablename;
