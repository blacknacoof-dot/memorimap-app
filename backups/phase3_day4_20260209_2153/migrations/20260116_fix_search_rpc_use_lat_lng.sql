-- ============================================================
-- Migration v6.3: Fix RPC Search Function to use lat/lng
-- Purpose: 
--   1. Update search_facilities to use 'lat'/'lng' columns instead of 'location'.
--   2. Ensure category filtering works with text values.
-- ============================================================

-- 1. DROP existing functions to ensure clean slate (signatures might vary)
DROP FUNCTION IF EXISTS search_facilities(double precision, double precision, double precision, text);
DROP FUNCTION IF EXISTS search_facilities(double precision, double precision, int, text);

-- 2. Create Corrected Search Function
CREATE OR REPLACE FUNCTION search_facilities(
    lat double precision,
    lng double precision,
    radius_meters double precision,
    filter_category text DEFAULT NULL
)
RETURNS SETOF facilities
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM facilities f
    WHERE 
      -- [1] Category Filter (빈 값이면 전체, 값이 있으면 정확히 일치)
      (filter_category IS NULL OR f.category = filter_category)
      AND
      -- [2] Valid Coordinates Check
      f.lat IS NOT NULL AND f.lng IS NOT NULL
      AND
      -- [3] Distance Filter using Haversine Formula (using lat/lng columns)
      -- This bypasses the 'location' geometry column which might be outdated
      (
        6371000 * acos(
          cos(radians(lat)) * cos(radians(f.lat)) *
          cos(radians(f.lng) - radians(lng)) +
          sin(radians(lat)) * sin(radians(f.lat))
        )
      ) <= radius_meters;
END;
$$;

SELECT 'Migration v6.3 (RPC Fix) Completed. Now using lat/lng columns.' as result;
