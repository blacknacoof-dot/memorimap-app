-- [Cleanup]
-- 함수 오버로딩 문제(PGRST203)를 해결하기 위해 모든 버전의 search_facilities를 명시적으로 삭제합니다.

-- 1. 기존 파라미터 순서/이름이 다를 수 있는 모든 변형 삭제
DROP FUNCTION IF EXISTS public.search_facilities(text, double precision, double precision, double precision);
DROP FUNCTION IF EXISTS public.search_facilities(double precision, double precision, double precision, text);

-- 2. 명확한 단일 함수 재생성
-- Parameters: user_lat, user_lng (프론트엔드와 일치)
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
