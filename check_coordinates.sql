-- [좌표 데이터 검증 스크립트]
-- 리스트에는 나오는데 지도에 안 나온다면 좌표 문제일 가능성이 큽니다.

-- 1. 이미지가 복구된 시설들의 좌표 상태 확인 (샘플 10개)
SELECT 
    name, 
    legacy_id, 
    latitude, 
    longitude,
    image_url
FROM public.facilities 
WHERE legacy_id IS NOT NULL 
  AND image_url IS NOT NULL
LIMIT 10;

-- 2. 좌표가 NULL이거나 0인 시설 수 확인
SELECT count(*) as "좌표_문제_시설_수"
FROM public.facilities
WHERE legacy_id IS NOT NULL 
  AND (latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0);

-- 3. 좌표 데이터 타입 확인 (text로 저장되어 있는지, numeric인지)
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'facilities' 
  AND column_name IN ('latitude', 'longitude');
