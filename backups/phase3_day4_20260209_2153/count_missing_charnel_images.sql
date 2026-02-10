-- [봉안시설 이미지 미보유 건수 확인]
-- DB에는 한글 '봉안시설' 대신 영어 'charnel', 'columbarium' 등으로 저장되어 있어 이를 모두 포함해야 합니다.

SELECT
  COUNT(*) AS "이미지_없는_봉안시설_수"
FROM facilities f
WHERE
  -- 봉안시설 관련 영문 코드 모두 포함
  f.type IN ('charnel', 'charnel_house', 'columbarium', 'memorial')
  -- image_url도 없고, images 배열도 비어있는 경우
  AND (f.image_url IS NULL OR TRIM(f.image_url) = '')
  AND (f.images IS NULL OR array_length(f.images, 1) IS NULL)
  -- 한국 좌표 범위 내
  AND f.latitude BETWEEN 33.0 AND 43.0
  AND f.longitude BETWEEN 124.0 AND 132.0;
