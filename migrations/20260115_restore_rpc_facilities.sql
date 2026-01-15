-- 1. 기존 함수들 깨끗이 삭제 (충돌 방지)
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN SELECT oid::regprocedure FROM pg_proc WHERE proname IN ('search_facilities', 'search_facilities_v2', 'search_facilities_by_text') LOOP 
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.oid || ' CASCADE'; 
    END LOOP;
END $$;

-- 2. search_facilities 복구
-- 프론트엔드와 파라미터 이름 일치 (lat, lng) + 내부 변수 사용으로 충돌 방지
CREATE OR REPLACE FUNCTION search_facilities(
    lat double precision,
    lng double precision,
    radius_meters int DEFAULT 5000,
    filter_category text DEFAULT NULL
)
RETURNS SETOF facilities
LANGUAGE plpgsql
AS $$
DECLARE
    -- 내부 변수로 재할당하여 컬럼명(lat)과의 충돌을 막음
    _lat double precision := lat;
    _lng double precision := lng;
    _radius double precision := radius_meters;
    _filter text := filter_category;
BEGIN
    RETURN QUERY
    SELECT *
    FROM facilities f
    WHERE
        -- PostGIS 없이 위경도 범위 계산 (1도 ≈ 111km)
        f.lat BETWEEN (_lat - (_radius / 111000.0)) AND (_lat + (_radius / 111000.0))
        AND
        f.lng BETWEEN (_lng - (_radius / 111000.0)) AND (_lng + (_radius / 111000.0))
        AND
        -- [중요] Enum 타입을 text로 변환하여 비교 (Type Error 해결)
        (_filter IS NULL OR _filter = '전체' OR f.category::text = _filter);
END;
$$;

-- 3. search_facilities_v2 복구 (스마트 검색용)
CREATE OR REPLACE FUNCTION search_facilities_v2(
    lat double precision,
    lng double precision,
    radius_meters int DEFAULT 5000,
    category text DEFAULT NULL,
    "limit" int DEFAULT 10
)
RETURNS SETOF facilities
LANGUAGE plpgsql
AS $$
DECLARE
    _lat double precision := lat;
    _lng double precision := lng;
    _radius double precision := radius_meters;
    _cat text := category;
    _limit int := "limit";
BEGIN
    RETURN QUERY
    SELECT *
    FROM facilities f
    WHERE
        f.lat BETWEEN (_lat - (_radius / 111000.0)) AND (_lat + (_radius / 111000.0))
        AND
        f.lng BETWEEN (_lng - (_radius / 111000.0)) AND (_lng + (_radius / 111000.0))
        AND
        -- Enum -> Text 형변환
        (_cat IS NULL OR _cat = '전체' OR f.category::text = _cat)
    ORDER BY
        -- 거리순 정렬
        (POWER(f.lat - _lat, 2) + POWER(f.lng - _lng, 2)) ASC
    LIMIT _limit;
END;
$$;

-- 4. search_facilities_by_text 복구
CREATE OR REPLACE FUNCTION search_facilities_by_text(
    text text,
    category text DEFAULT NULL
)
RETURNS SETOF facilities
LANGUAGE plpgsql
AS $$
DECLARE
    _text text := text;
    _cat text := category;
BEGIN
    RETURN QUERY
    SELECT *
    FROM facilities f
    WHERE 
        (f.name ILIKE '%' || _text || '%' OR f.address ILIKE '%' || _text || '%')
        AND 
        -- Enum -> Text 형변환
        (_cat IS NULL OR _cat = '전체' OR f.category::text = _cat)
    LIMIT 20;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION search_facilities TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_facilities_v2 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_facilities_by_text TO anon, authenticated, service_role;
