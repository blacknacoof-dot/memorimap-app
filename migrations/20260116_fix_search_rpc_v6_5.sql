-- ============================================================
-- Migration v6.5: Fix RPC Signature Mismatch (PGRST202)
-- Purpose: 
--   1. Drop old function signatures to prevent conflicts.
--   2. Create 'search_facilities' with 'user_lat'/'user_lng' parameters.
-- ============================================================

-- 1. 기존 함수 삭제 (오래된 파라미터 이름을 가진 함수들 정리)
DROP FUNCTION IF EXISTS search_facilities(double precision, double precision, double precision, text);
DROP FUNCTION IF EXISTS search_facilities(double precision, double precision, int, text);

-- 2. 새 함수 생성 (user_lat, user_lng 사용)
CREATE OR REPLACE FUNCTION search_facilities(
    user_lat double precision,   -- ✅ Frontend에서 보내는 이름과 일치!
    user_lng double precision,   -- ✅ Frontend에서 보내는 이름과 일치!
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
      -- 1) 카테고리 필터 (값이 있을 때만 적용)
      (filter_category IS NULL OR f.category = filter_category)
      AND
      -- 2) 유효한 좌표 확인
      f.lat IS NOT NULL AND f.lng IS NOT NULL
      AND
      -- 3) 거리 계산 (Haversine Formula)
      (
        6371000 * acos(
          cos(radians(user_lat)) * cos(radians(f.lat)) *
          cos(radians(f.lng) - radians(user_lng)) +
          sin(radians(user_lat)) * sin(radians(f.lat))
        )
      ) <= radius_meters;
END;
$$;

SELECT 'Migration v6.5 Completed. RPC signature aligned with App.tsx' as result;
