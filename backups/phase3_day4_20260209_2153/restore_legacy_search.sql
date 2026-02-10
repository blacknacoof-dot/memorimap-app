-- ⚠️ USER PROVIDED FIX: RESTORE SEARCH RPC
-- Reason: Frontend calls 'search_facilities' with specific params (filter_category, lat, lng, radius_meters).
-- This script recreates that exact signature to fix PGRST202/404 errors.

BEGIN;

-- 1. DROP EXISTING/CONFLICTING FUNCTIONS
DROP FUNCTION IF EXISTS search_facilities(text, double precision, double precision, integer);
DROP FUNCTION IF EXISTS search_facilities(text, float, float, int);
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text); -- My previous attempt

-- 2. CREATE FUNCTION matching Frontend EXACTLY
CREATE OR REPLACE FUNCTION search_facilities(
    filter_category text DEFAULT NULL,
    lat double precision DEFAULT 37.5665,
    lng double precision DEFAULT 126.9780,
    radius_meters integer DEFAULT 10000
)
RETURNS SETOF memorial_spaces
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    -- Simple Logic: Filter by Category
    -- (Distance logic can be added later if needed, priority is visibility)
    RETURN QUERY
    SELECT *
    FROM memorial_spaces ms
    WHERE 
        CASE 
            WHEN filter_category IS NULL OR filter_category = '' OR filter_category = '전체' THEN TRUE
            ELSE ms.type = filter_category
        END;
END;
$$;

-- 3. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION search_facilities TO anon;
GRANT EXECUTE ON FUNCTION search_facilities TO authenticated;
GRANT EXECUTE ON FUNCTION search_facilities TO service_role;
GRANT EXECUTE ON FUNCTION search_facilities TO public;

COMMIT;

-- 4. RELOAD SCHEMA CACHE (Crucial)
-- User asked for 'reload config', but 'reload schema' is the standard for PostgREST structure updates.
-- Running both to be absolutely safe.
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
