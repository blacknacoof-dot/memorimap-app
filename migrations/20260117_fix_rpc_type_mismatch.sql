-- [Fix Type Mismatch]
-- 에러: "Returned type text does not match expected type uuid"
-- 해결: ID 반환 타입을 UUID -> TEXT로 변경하여 DB 컬럼 타입(TEXT 추정)과 일치시킵니다.
-- 또한 중복 정의된 함수들을 다시 한 번 확실하게 정리합니다.

-- 1. 모든 알려진 시그니처 삭제 (청소)
DROP FUNCTION IF EXISTS public.search_facilities(text, double precision, double precision, double precision);
DROP FUNCTION IF EXISTS public.search_facilities(double precision, double precision, double precision, text);

-- 2. 안전한 타입(TEXT)으로 함수 재생성
CREATE OR REPLACE FUNCTION public.search_facilities(
  filter_category TEXT,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION
)
RETURNS TABLE (
  id TEXT,                     -- ✅ UUID -> TEXT로 변경 (가장 안전함)
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
    f.id::text,               -- ✅ 명시적 형변환 (UUID일 수도, TEXT일 수도 있는 상황 방지)
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
