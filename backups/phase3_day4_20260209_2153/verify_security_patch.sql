-- ============================================================
-- VERIFICATION: Check if security holes are plugged
-- Role: Public / Authenticated
-- ============================================================

-- 1. Check if ANY public write access remains (Should be EMPTY)
SELECT 
    tablename, 
    policyname,
    cmd, 
    roles::text[]
FROM pg_policies 
WHERE schemaname = 'public' 
  AND 'public' = ANY(roles::text[])
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
ORDER BY tablename;

-- 2. Verify subscription_payments is locked down
SELECT policyname, cmd, roles::text[], qual
FROM pg_policies 
WHERE tablename = 'subscription_payments';

-- 3. Verify backup tables are service_role only
SELECT tablename, policyname, roles::text[]
FROM pg_policies 
WHERE tablename LIKE '%backup%';

-- 4. Verify admin tables have ownership checks
SELECT tablename, policyname, qual
FROM pg_policies 
WHERE tablename IN ('admin_users', 'facility_admins', 'sangjo_hq_admins');
