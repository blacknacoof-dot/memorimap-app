-- ============================================================
-- Comprehensive RLS Policy Audit
-- ============================================================

-- 1. List all RLS policies with their definitions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as "USING expression",
    with_check as "WITH CHECK expression"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 2. Check for potentially over-permissive policies (always TRUE)
SELECT 
    tablename,
    policyname,
    cmd,
    qual as "USING expression"
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual = 'true' 
    OR qual IS NULL
  )
ORDER BY tablename;

-- 3. Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Tables without any RLS policies (potential security gap)
SELECT 
    t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- 5. Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count,
    array_agg(DISTINCT cmd::text) as commands_covered
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;
