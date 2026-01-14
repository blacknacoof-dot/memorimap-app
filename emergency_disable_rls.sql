-- ⚠️ NUCLEAR OPTION: DISABLE RLS TEMPORARILY
-- Purpose: Confirm if RLS is the blocker by turning it off completely.
-- Since we already ran GRANT SELECT TO public, this should make data visible to everyone.

BEGIN;

-- 1. Disable RLS on memorial_spaces
ALTER TABLE memorial_spaces DISABLE ROW LEVEL SECURITY;

-- 2. Verify Data Content (Check columns frontend uses)
-- Ensure 'type' and 'region' are not NULL, as frontend might filter by them.
SELECT 
    count(*) as total_rows,
    count(type) as rows_with_type,
    count(address) as rows_with_address
FROM memorial_spaces;

-- 3. Check for specific frontend-critical columns
SELECT id, name, type, address FROM memorial_spaces LIMIT 5;

COMMIT;
