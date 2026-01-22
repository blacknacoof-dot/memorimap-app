-- [좌표 값 상세 점검]
-- 좌표가 0이거나 NULL인 경우, 지도에 표시되지 않습니다.

-- 1. 통계 확인
SELECT 
    count(*) as "전체_시설_수",
    count(case when latitude IS NULL OR longitude IS NULL then 1 end) as "좌표_NULL_갯수",
    count(case when latitude = 0 OR longitude = 0 then 1 end) as "좌표_0_갯수",
    count(case when (latitude < 33 OR latitude > 43) AND latitude IS NOT NULL then 1 end) as "위도_범위_이상_갯수" -- 한국 범위 벗어남
FROM public.facilities;

-- 2. 이미지는 있는데 좌표가 이상한 데이터 샘플 (5개)
SELECT id, name, legacy_id, latitude, longitude, image_url
FROM public.facilities
WHERE (image_url IS NOT NULL OR (images IS NOT NULL AND array_length(images,1) > 0))
  AND (latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0)
LIMIT 5;
