-- =====================================================
-- VIEWPORT SEARCH (화면 영역 기준 검색)
-- =====================================================
-- 지도의 남서쪽(min)과 북동쪽(max) 좌표를 받아 그 안의 시설만 반환합니다.

CREATE OR REPLACE FUNCTION public.search_facilities_in_view(
    min_lat float,
    min_lng float,
    max_lat float,
    max_lng float
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    type TEXT,
    address TEXT,
    lat float,
    lng float,
    images TEXT[],         -- 썸네일 표시용
    image_url TEXT,        -- 대표 이미지
    rating FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.type,
        f.address,
        f.lat,
        f.lng,
        f.images,
        f.image_url,
        0.0::float as rating -- 평점 컬럼이 없으면 0.0, 추후 reviews_avg 등으로 교체 가능
    FROM 
        public.facilities f
    WHERE 
        -- [핵심] 위도(lat)와 경도(lng)가 화면 범위 안에 있는 것만 필터링
        f.lat BETWEEN min_lat AND max_lat
        AND f.lng BETWEEN min_lng AND max_lng
    LIMIT 100; -- 성능 보호를 위해 한 번에 최대 100개까지만 로딩
END;
$$;
