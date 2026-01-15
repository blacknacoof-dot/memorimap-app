-- 1. 트랜잭션 시작
BEGIN;

-- 2. 기존 함수 삭제 (오류 방지)
-- Drop existing function with matching signature
DROP FUNCTION IF EXISTS search_facilities(text, double precision, double precision, integer);

-- 3. 함수 재생성 (type -> category 변경)
CREATE OR REPLACE FUNCTION search_facilities(
    filter_category text DEFAULT NULL,
    lat double precision DEFAULT 37.5665,
    lng double precision DEFAULT 126.9780,
    radius_meters integer DEFAULT 10000
)
RETURNS SETOF memorial_spaces
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    -- Simple Logic: Filter by Category (updated column)
    RETURN QUERY
    SELECT *
    FROM memorial_spaces ms
    WHERE 
        CASE 
            WHEN filter_category IS NULL OR filter_category = '' OR filter_category = '전체' THEN TRUE
            ELSE ms.category = filter_category -- Updated from ms.type
        END;
END;
$$;

-- 4. 권한 부여
GRANT EXECUTE ON FUNCTION search_facilities TO anon;
GRANT EXECUTE ON FUNCTION search_facilities TO authenticated;
GRANT EXECUTE ON FUNCTION search_facilities TO service_role;
GRANT EXECUTE ON FUNCTION search_facilities TO public;

COMMIT;

-- 5. 스키마 캐시 리로드
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
