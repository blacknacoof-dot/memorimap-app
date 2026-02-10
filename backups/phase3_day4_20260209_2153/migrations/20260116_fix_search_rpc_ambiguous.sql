-- ============================================================
-- Migration v6.4: Fix Ambiguous Column Error
-- Purpose: Rename input parameters to 'user_lat/user_lng' to avoid conflict with table columns
-- ============================================================

-- 1. Drop the ambiguous function (drop both potential signatures to be safe)
DROP FUNCTION IF EXISTS search_facilities(double precision, double precision, double precision, text);

-- 2. Re-create with distinct parameter names
CREATE OR REPLACE FUNCTION search_facilities(
    user_lat double precision,   -- Changed from 'lat'
    user_lng double precision,   -- Changed from 'lng'
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
      -- Category Filter (빈 값이면 전체, 값이 있으면 정확히 일치)
      (filter_category IS NULL OR f.category = filter_category)
      AND
      -- Valid Coordinates Check
      f.lat IS NOT NULL AND f.lng IS NOT NULL
      AND
      -- Distance Filter (Using user_lat/user_lng vs f.lat/f.lng)
      (
        6371000 * acos(
          cos(radians(user_lat)) * cos(radians(f.lat)) *
          cos(radians(f.lng) - radians(user_lng)) +
          sin(radians(user_lat)) * sin(radians(f.lat))
        )
      ) <= radius_meters;
END;
$$;

SELECT 'Migration v6.4 Completed. Parameter ambiguity fixed.' as result;
