-- ⚠️ FIX RPC PERMISSIONS (Search Functions)
-- Purpose: Even if tables are open, the 'Search Functions' (RPCs) might be blocked for anonymous users.

BEGIN;

-- 1. Grant EXECUTE on Search Functions
-- If these functions exist, we must ensure public can run them.

-- Search V2 (Radius)
GRANT EXECUTE ON FUNCTION search_facilities_v2 TO anon;
GRANT EXECUTE ON FUNCTION search_facilities_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION search_facilities_v2 TO public;

-- Search Legacy
GRANT EXECUTE ON FUNCTION search_facilities TO anon;
GRANT EXECUTE ON FUNCTION search_facilities TO authenticated;
GRANT EXECUTE ON FUNCTION search_facilities TO public;

-- Search Text/Region
GRANT EXECUTE ON FUNCTION search_facilities_by_text TO anon;
GRANT EXECUTE ON FUNCTION search_facilities_by_text TO authenticated;
GRANT EXECUTE ON FUNCTION search_facilities_by_text TO public;

-- 2. Verify Function Existence (sanity check)
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('search_facilities_v2', 'search_facilities', 'search_facilities_by_text');

COMMIT;
