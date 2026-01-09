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
            -- 1. [데이터 정제] '경기 ' -> '경기도 ', '서울 ' -> '서울특별시 ', '부산 ' -> '부산광역시 ' 등으로 표준화 후 앞 2단어 추출
            array_to_string(
                (string_to_array(
                    REPLACE(
                        REPLACE(
                            REPLACE(address, '경기 ', '경기도 '), 
                            '서울 ', '서울특별시 '
                        ),
                        '부산 ', '부산광역시 '
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
-- [Fix] SQL 수정 코드: 공백을 %로 변환하여 유연한 검색 (예: "부산 금정구" -> "부산%금정구" -> "부산광역시 금정구")
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
    rating NUMERIC,        
    review_count NUMERIC,  
    image_url TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_search_pattern TEXT;
BEGIN
    -- 공백을 %로 치환하여 중간에 다른 단어(광역시, 도 등)가 있어도 매칭되도록 함
    v_search_pattern := '%' || REPLACE(p_text, ' ', '%') || '%';

    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.type as category,
        m.address,
        m.lat::DOUBLE PRECISION, 
        m.lng::DOUBLE PRECISION,
        m.rating::NUMERIC,       
        m.review_count::NUMERIC, 
        m.image_url
    FROM 
        public.memorial_spaces m
    WHERE 
        (m.address ILIKE v_search_pattern OR m.name ILIKE v_search_pattern)
        AND (p_category IS NULL OR m.type = p_category)
    LIMIT 20;
END;
$$;
