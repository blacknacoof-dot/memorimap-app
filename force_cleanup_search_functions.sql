-- ⚠️ FORCE CLEANUP & RECREATE (Dynamic Drop)
-- Purpose: "Function name is not unique" means multiple versions exist. We will find and kill ALL of them.

BEGIN;

-- 1. DYNAMICALLY DROP ALL 'search_facilities_v2' variants
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure as signature 
        FROM pg_proc 
        WHERE proname IN ('search_facilities_v2', 'search_facilities')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.signature || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', r.signature;
    END LOOP;
END $$;


-- 2. RECREATE search_facilities_v2 (Clean Version)
CREATE OR REPLACE FUNCTION search_facilities_v2(
    p_lat float,
    p_lng float,
    p_radius_meters int DEFAULT 5000,
    p_category text DEFAULT NULL,
    p_limit int DEFAULT 20
)
RETURNS SETOF memorial_spaces
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM memorial_spaces
    WHERE 
        -- Simple Box Filter
        lat BETWEEN p_lat - (p_radius_meters / 111000.0) AND p_lat + (p_radius_meters / 111000.0)
        AND
        lng BETWEEN p_lng - (p_radius_meters / 111000.0) AND p_lng + (p_radius_meters / 111000.0)
        AND
        (p_category IS NULL OR type = p_category)
    LIMIT p_limit;
$$;


-- 3. PERMISSIONS (Explicit Signature)
GRANT EXECUTE ON FUNCTION search_facilities_v2(float, float, int, text, int) TO public;
GRANT EXECUTE ON FUNCTION search_facilities_v2(float, float, int, text, int) TO anon;
GRANT EXECUTE ON FUNCTION search_facilities_v2(float, float, int, text, int) TO authenticated;

COMMIT;

-- 4. TEST EXECUTION
SELECT id, name, type FROM search_facilities_v2(37.5665, 126.9780, 50000, NULL, 5);
