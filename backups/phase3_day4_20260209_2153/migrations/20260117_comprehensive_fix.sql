-- =============================================
-- 추모맵 완전 마이그레이션 (2026-01-17) - v2 (Type Fix)
-- =============================================

-- [Step 1] target_audience 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'facilities' AND column_name = 'target_audience'
    ) THEN
        ALTER TABLE public.facilities 
        ADD COLUMN target_audience TEXT DEFAULT 'HUMAN';
    END IF;
END $$;

-- [Step 2] 반려동물 시설 분류
UPDATE public.facilities
SET
    category = 'pet_funeral',
    target_audience = 'PET'
WHERE
    category = 'funeral_home'
    AND category != 'pet_funeral' -- Avoid redundant updates
    AND (
        name LIKE '%펫%'
        OR name LIKE '%동물%'
        OR name LIKE '%강아지%'
        OR name LIKE '%21그램%'
        OR name LIKE '%포레스트%'
    );

-- [Step 3] search_facilities 함수 재정의 (UUID -> TEXT 타입 호환성 수정)
-- 기존 함수들 모두 삭제 (안전장치)
DROP FUNCTION IF EXISTS public.search_facilities(text, double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION public.search_facilities(
  filter_category TEXT,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  category TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  image_url TEXT  -- ✅ [Added] Return image URL
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id::text,
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
    )) AS distance_meters,
    -- ✅ [Logic] Extract first image from array if available
    CASE 
      WHEN array_length(f.images, 1) > 0 THEN f.images[1]
      ELSE NULL 
    END::text AS image_url
  FROM facilities f
  WHERE 
    (filter_category IS NULL OR f.category = filter_category)
    AND f.lat IS NOT NULL 
    AND f.lng IS NOT NULL
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
