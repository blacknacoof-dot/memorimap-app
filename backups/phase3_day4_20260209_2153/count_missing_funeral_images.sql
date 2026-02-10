-- [장례식장(Funeral Home) 이미지 미보유 건수 확인]
SELECT
    count(*) as "전체_장례식장_수",
    count(case when (image_url IS NULL OR TRIM(image_url) = '') AND (images IS NULL OR array_length(images, 1) IS NULL) then 1 end) as "이미지_없는_곳",
    round(count(case when (image_url IS NULL OR TRIM(image_url) = '') AND (images IS NULL OR array_length(images, 1) IS NULL) then 1 end)::numeric / count(*) * 100, 1) as "미보유율(%)"
FROM facilities
WHERE type IN ('funeral_home', 'funeral');

-- 샘플 확인
SELECT id, name, address 
FROM facilities 
WHERE type IN ('funeral_home', 'funeral')
  AND (image_url IS NULL OR TRIM(image_url) = '')
LIMIT 5;
