-- [이미지 없는 시설 현황 분석]
-- 봉안시설(charnel/columbarium) 위주로 확인하지만, 전체적으로 봅니다.

SELECT 
    type,
    count(*) as "전체_시설_수",
    count(case when (image_url IS NULL OR image_url = '') AND (images IS NULL OR array_length(images, 1) IS NULL) then 1 end) as "이미지_없는_곳",
    round(count(case when (image_url IS NULL OR image_url = '') AND (images IS NULL OR array_length(images, 1) IS NULL) then 1 end)::numeric / count(*) * 100, 1) as "미보유율(%)"
FROM public.facilities
GROUP BY type
ORDER BY "이미지_없는_곳" DESC;

-- 봉안시설(charnel 계열) 중 이미지가 없는 곳 샘플 5개
SELECT name, address, type
FROM public.facilities
WHERE (type IN ('charnel', 'charnel_house', 'columbarium', 'memorial'))
  AND (image_url IS NULL OR image_url = '') 
  AND (images IS NULL OR array_length(images, 1) IS NULL)
LIMIT 5;
