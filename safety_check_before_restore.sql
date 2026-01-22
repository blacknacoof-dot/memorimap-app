-- [복구 전 안전 점검 스크립트]
-- 이 스크립트는 데이터를 수정하지 않고 읽기만 합니다.

-- 1. 테이블 존재 여부 및 컬럼 타입 확인
SELECT 
    column_name, 
    data_type, 
    udt_name -- 구체적인 타입 이름 (예: _text 는 text[] 배열)
FROM information_schema.columns 
WHERE table_name = 'facilities' 
  AND column_name IN ('legacy_id', 'images', 'image_url', 'type', 'name', 'address');

-- 2. 현재 데이터 통계
SELECT 
    count(*) as "전체_시설_수",
    count(case when image_url is not null and image_url != '' then 1 end) as "현재_이미지_보유_수",
    count(case when legacy_id is not null then 1 end) as "legacy_id_보유_수"
FROM public.facilities;

-- 3. 중복 데이터 존재 여부 확인 (이름과 주소가 완전히 같은 경우)
SELECT 
    name, 
    address, 
    count(*) as "중복_건수"
FROM public.facilities
GROUP BY name, address
HAVING count(*) > 1
ORDER BY count(*) DESC
LIMIT 5;

-- 4. legacy_id 컬럼이 아예 없는지 확인 (에러가 나면 컬럼이 없는 것)
-- 이 쿼리가 실패하면 'readd_legacy_id.sql'을 먼저 실행해야 합니다.
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'facilities' AND column_name = 'legacy_id'
    ) THEN 
        RAISE NOTICE '경고: legacy_id 컬럼이 아직 존재하지 않습니다. readd_legacy_id.sql을 먼저 실행하세요.';
    ELSE 
        RAISE NOTICE '확인: legacy_id 컬럼이 존재합니다. 작업을 계속할 수 있습니다.';
    END IF; 
END $$;
