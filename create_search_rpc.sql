-- 1. PostGIS 확장 기능 켜기 (이미 켜져 있다면 패스)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. facilities 테이블에 필수 컬럼 추가 (없으면 생성)
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS price_per_pyeong TEXT;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS features TEXT[];

-- 3. (임시) 기존 데이터에 임의의 좌표 및 기본값 넣기 (Update)
-- 실제 서비스에선 주소를 위/경도로 변환(Geocoding)해서 넣어야 하지만, 
-- 지금은 테스트를 위해 서울/경기 인근 좌표로 업데이트합니다.
UPDATE public.facilities 
SET location = ST_SetSRID(ST_MakePoint(126.9780 + (random() * 0.1), 37.5665 + (random() * 0.1)), 4326)::geography
WHERE location IS NULL;

-- 4. 효율적인 거리 계산을 위한 공간 인덱스 생성
CREATE INDEX IF NOT EXISTS facilities_location_idx ON public.facilities USING GIST (location);

-- 5. 함수 생성 (테이블명을 facilities로 수정 및 컬럼 매핑)
CREATE OR REPLACE FUNCTION public.search_facilities_v2(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 50000, -- 테스트 위해 반경 50km로 넉넉하게
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    category TEXT,      -- type -> category (기존 테이블 컬럼명 매칭)
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    distance DOUBLE PRECISION,
    rating NUMERIC,
    image_url TEXT,
    price_range TEXT,   -- price_per_pyeong -> price_range 매칭
    features TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id::text,
        f.name,
        f.category,
        f.address,
        st_y(f.location::geometry) as lat,
        st_x(f.location::geometry) as lng,
        st_distance(
            f.location,
            st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
        ) as distance,
        f.rating,
        f.image_url,
        f.price_per_pyeong as price_range, -- 컬럼명 매핑
        f.features
    FROM 
        public.facilities f 
    WHERE 
        (p_category IS NULL OR f.category = p_category)
        AND st_dwithin(
            f.location,
            st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
            p_radius_meters
        )
    ORDER BY 
        distance ASC
    LIMIT 
        p_limit;
END;
$$;
