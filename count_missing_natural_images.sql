-- [자연장(Natural Burial) 이미지 미보유 건수 확인]
SELECT
  COUNT(*) AS "이미지_없는_자연장_수"
FROM facilities f
WHERE
  -- 자연장 관련 영문 코드 모두 포함
  f.type IN ('natural', 'natural_burial', 'tree_burial')
  -- image_url도 없고, images 배열도 비어있는 경우
  AND (f.image_url IS NULL OR TRIM(f.image_url) = '')
  AND (f.images IS NULL OR array_length(f.images, 1) IS NULL)
  -- 한국 좌표 범위 내
  AND f.latitude BETWEEN 33.0 AND 43.0
  AND f.longitude BETWEEN 124.0 AND 132.0;
