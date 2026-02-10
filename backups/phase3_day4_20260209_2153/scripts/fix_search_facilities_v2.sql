-- ================================================
-- FIX: search_facilities_v2 Column Name Mismatch
-- Issue: RPC uses lat/lng but table has latitude/longitude
-- Date: 2026-02-02
-- ================================================

-- 1. First, check actual column names in facilities table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'facilities' 
AND column_name IN ('lat', 'lng', 'latitude', 'longitude')
ORDER BY column_name;

-- 2. Drop existing broken function
DROP FUNCTION IF EXISTS search_facilities_v2(double precision, double precision, integer, text, integer) CASCADE;

-- 3. Recreate with CORRECT column names (latitude/longitude)
CREATE OR REPLACE FUNCTION search_facilities_v2(
    p_lat double precision,
    p_lng double precision,
    radius_meters int DEFAULT 5000,
    category text DEFAULT NULL,
    result_limit int DEFAULT 10
)
RETURNS SETOF facilities
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _lat double precision := p_lat;
    _lng double precision := p_lng;
    _radius double precision := radius_meters;
    _cat text := category;
    _limit int := result_limit;
BEGIN
    RETURN QUERY
    SELECT *
    FROM facilities f
    WHERE
        -- Use CORRECT column names: latitude/longitude
        f.latitude BETWEEN (_lat - (_radius / 111000.0)) AND (_lat + (_radius / 111000.0))
        AND
        f.longitude BETWEEN (_lng - (_radius / 111000.0)) AND (_lng + (_radius / 111000.0))
        AND
        f.status = 'active'
        AND
        (_cat IS NULL OR _cat = '전체' OR f.type = _cat)
    ORDER BY
        -- Distance calculation using latitude/longitude
        (POWER(f.latitude - _lat, 2) + POWER(f.longitude - _lng, 2)) ASC
    LIMIT _limit;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION search_facilities_v2 TO anon, authenticated, service_role;

-- 5. Test the function
SELECT id, name, type FROM search_facilities_v2(37.5665, 126.9780, 5000, NULL, 5);

-- 6. EXPLAIN ANALYZE (after fix)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM search_facilities_v2(37.5665, 126.9780, 5000, NULL, 50);
