-- 1. 지역 자동완성 (시/군/구 단위 통합 버전 + 정규화)
-- "경기" -> "경기도", "서울" -> "서울특별시" 등으로 표준화 후 앞 2단어 추출
CREATE OR REPLACE FUNCTION public.get_distinct_regions(search_text TEXT)
RETURNS SETOF TEXT 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        region
    FROM (
        SELECT 
            -- 1. [데이터 정제] '경기 ' -> '경기도 ', '서울 ' -> '서울특별시 ' 등으로 표준화 후 앞 2단어 추출
            array_to_string(
                (string_to_array(
                    REPLACE(
                        REPLACE(address, '경기 ', '경기도 '), 
                        '서울 ', '서울특별시 '
                    ), 
                ' '))[1:2], 
            ' ') AS region
        FROM public.memorial_spaces
        WHERE address ILIKE '%' || search_text || '%'
          AND address IS NOT NULL
    ) sub
    ORDER BY region ASC
    LIMIT 10;
END;
$$;


-- 2. 시설 텍스트 검색 (PostGIS 좌표 변환 + 이름/주소 동시 검색)
-- [Fix] SQL 수정 코드: rating, review_count 타입을 NUMERIC으로 강제 변환
DROP FUNCTION IF EXISTS public.search_facilities_by_text;

CREATE OR REPLACE FUNCTION public.search_facilities_by_text(
    p_text TEXT,
    p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    category TEXT,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    rating NUMERIC,        -- 7번째 컬럼 (문제의 원인)
    review_count NUMERIC,  -- 8번째 컬럼
    image_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.type as category,
        m.address,
        -- [수정] location 컬럼이 없으므로 lat, lng 컬럼을 직접 반환
        m.lat::DOUBLE PRECISION, 
        m.lng::DOUBLE PRECISION,
        m.rating::NUMERIC,       -- [수정 핵심] ::NUMERIC 을 붙여서 타입을 강제로 맞춤
        m.review_count::NUMERIC, -- [수정 핵심] 여기도 안전하게 변환
        m.image_url
    FROM 
        public.memorial_spaces m
    WHERE 
        (m.address ILIKE '%' || p_text || '%' OR m.name ILIKE '%' || p_text || '%')
        AND (p_category IS NULL OR m.type = p_category)
    LIMIT 20;
END;
$$;
