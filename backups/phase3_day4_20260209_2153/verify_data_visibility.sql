-- DIAGNOSIS: Data Existence vs Visibility
-- Purpose: Check if data was deleted or just hidden by RLS.

BEGIN;

-- 1. Check Total Physical Rows (Bypass RLS for this count if run as admin/postgres)
SELECT count(*) as "Total Physical Rows (Real Data)" FROM memorial_spaces;

-- 2. Check RLS Status
SELECT relname, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'memorial_spaces';

-- 3. Check Policies
SELECT policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'memorial_spaces';

-- 4. Sample Data
-- See if we can grab just one row's ID and Name to confirm content
SELECT id, name, type FROM memorial_spaces LIMIT 5;

COMMIT;
