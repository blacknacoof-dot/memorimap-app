-- ================================================
-- 1. Unsplash 기본 이미지 전부 삭제 (NULL로 설정)
-- ================================================

-- 대표이미지에서 Unsplash 이미지 삭제
UPDATE memorial_spaces
SET image_url = NULL
WHERE image_url LIKE '%unsplash%';

-- 갤러리에서도 Unsplash 이미지 삭제 (빈 배열로)
UPDATE memorial_spaces
SET gallery_images = '{}'
WHERE gallery_images::text LIKE '%unsplash%';

-- ================================================
-- 2. 금강장례식장 좌표 수정 (인천 미추홀구)
-- ================================================

UPDATE memorial_spaces
SET lat = 37.4477, lng = 126.6502
WHERE name = '금강장례식장' 
  AND address LIKE '%인천%미추홀%';

-- ================================================
-- 확인용 쿼리
-- ================================================

-- Unsplash 이미지 남은 개수 확인
SELECT COUNT(*) as unsplash_count
FROM memorial_spaces
WHERE image_url LIKE '%unsplash%';

-- 삭제된 이미지 개수 확인
SELECT COUNT(*) as null_image_count
FROM memorial_spaces
WHERE image_url IS NULL;
