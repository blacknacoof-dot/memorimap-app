-- 기존 함수 (파라미터 이름이 다르거나 잘못된 버전) 삭제
DROP FUNCTION IF EXISTS public.search_facilities(text, double precision, double precision, double precision);

-- [Final Fix]
-- 1. Parameters: user_lat, user_lng (Matches Frontend Code & Avoids naming conflict)
-- 2. Returns: lat, lng (Matches Database Columns & Frontend Expectations)
-- 3. Logic: Uses proper f.lat, f.lng columns (Fixes 'column not found' error)

CREATE OR REPLACE FUNCTION public.search_facilities(
  filter_category TEXT,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.category,
    f.address,
    f.lat,
    f.lng,
    (6371000 * acos(
      cos(radians(user_lat)) * 
      cos(radians(f.lat)) * 
      cos(radians(f.lng) - radians(user_lng)) + 
      sin(radians(user_lat)) * 
      sin(radians(f.lat))
    )) AS distance_meters
  FROM facilities f
  WHERE 
    (filter_category IS NULL OR f.category = filter_category)
    AND f.lat IS NOT NULL AND f.lng IS NOT NULL
    AND (6371000 * acos(
      cos(radians(user_lat)) * 
      cos(radians(f.lat)) * 
      cos(radians(f.lng) - radians(user_lng)) + 
      sin(radians(user_lat)) * 
      sin(radians(f.lat))
    )) <= radius_meters
  ORDER BY distance_meters;
END;
$$;
