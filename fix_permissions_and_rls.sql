-- ⚠️ FIX PERMISSIONS & RLS (Final Open)
-- Purpose: Ensure 'anon' (unauthenticated users) have TABLE LEVEL permissions, not just RLS policies.

BEGIN;

-- 1. GRANT TABLE PERMISSIONS (Crucial step often missed)
-- RLS policies only work if the user has permission to access the table first.
GRANT SELECT ON TABLE memorial_spaces TO anon;
GRANT SELECT ON TABLE memorial_spaces TO authenticated;
GRANT SELECT ON TABLE memorial_spaces TO public;

-- 2. RESET RLS POLICIES
ALTER TABLE memorial_spaces ENABLE ROW LEVEL SECURITY;

-- Drop any potentially conflicting or restrictive policies
DROP POLICY IF EXISTS "Public Read Facilities" ON memorial_spaces;
DROP POLICY IF EXISTS "Public Read Facilities Auth" ON memorial_spaces;
DROP POLICY IF EXISTS "Public Read Facilities Anon" ON memorial_spaces;
DROP POLICY IF EXISTS "facilities_select_public" ON memorial_spaces;

-- 3. CREATE SINGLE PERMISSIVE POLICY
-- "TO public" covers both anon and authenticated
CREATE POLICY "Allow Public Read Access" 
ON memorial_spaces 
FOR SELECT 
TO public 
USING (true);

-- 4. DIAGNOSTIC OUTPUT
SELECT 
    t.relname, 
    has_table_privilege('anon', t.oid, 'SELECT') as anon_can_select,
    has_table_privilege('authenticated', t.oid, 'SELECT') as auth_can_select
FROM pg_class t
WHERE t.relname = 'memorial_spaces';

COMMIT;
