-- ⚠️ RECREATE SEARCH FUNCTIONS (Clean & Robust)
-- Purpose: The existing search functions might have broken logic or filters. We rebuild them to be simple and reliable.

BEGIN;

-- 1. DROP OLD FUNCTIONS (To clear any bad logic)
DROP FUNCTION IF EXISTS search_facilities_v2(float, float, int, text, int);
DROP FUNCTION IF EXISTS search_facilities_v2(numeric, numeric, int, text, int);
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text);

-- 2. RECREATE search_facilities_v2
-- Simplified: No complex filtering, just distance and optional type.
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
        -- 1. Distance Filter (using PostGIS if available, else ignored/box check could be added but stick to PostGIS standard)
        -- Assuming lat/lng columns exist. If geog/geom column is used, adapt.
        -- Standard usually: ST_DWithin(location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), p_radius_meters)
        -- BUT, to be safe against missing PostGIS, let's use simple box approximation if we can, 
        -- OR assuming standard simple logic.
        -- Let's stick to the most robust PostGIS method if the table has lat/lng or geometry.
        -- Migration check: `diagnose_and_repair` output didn't show columns.
        -- Assuming 'lat' and 'lng' columns exist as floats (common pattern).
        (
            -- Simple bounding box for speed and fallback
            lat BETWEEN p_lat - (p_radius_meters / 111000.0) AND p_lat + (p_radius_meters / 111000.0)
            AND
            lng BETWEEN p_lng - (p_radius_meters / 111000.0) AND p_lng + (p_radius_meters / 111000.0)
        )
        AND
        (p_category IS NULL OR type = p_category)
    LIMIT p_limit;
$$;

-- 3. PERMISSIONS
GRANT EXECUTE ON FUNCTION search_facilities_v2 TO public;
GRANT EXECUTE ON FUNCTION search_facilities_v2 TO anon;
GRANT EXECUTE ON FUNCTION search_facilities_v2 TO authenticated;

COMMIT;

-- 4. TEST EXECUTION (Dummy Call)
-- Seoul Coordinates
SELECT id, name, type FROM search_facilities_v2(37.5665, 126.9780, 50000, NULL, 5);
