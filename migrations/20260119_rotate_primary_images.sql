-- ==========================================
-- 장례식장별 고유한 대표 이미지 할당 (수정 버전)
-- Assign Unique Primary Images - Fixed Version
-- ==========================================
-- 문제: 이전 버전에서 모든 시설이 같은 대표 이미지 사용
-- 해결: 시설 ID 순서로 8개 이미지를 순환 할당

-- ==========================================
-- 실행 전 확인
-- ==========================================
SELECT 
  COUNT(*) as "총_시설_수",
  COUNT(DISTINCT images[1]) as "고유_대표_이미지_수"
FROM facilities
WHERE category = 'funeral_home'
  AND CAST(images AS TEXT) LIKE '%funeral_real%';

-- ==========================================
-- 업데이트 실행
-- ==========================================
WITH image_pool AS (
  SELECT ARRAY[
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_1_1768784069719.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_2_1768784070579.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_3_1768784071268.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_4_1768784071735.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_5_1768784072229.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_6_1768784072689.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_7_1768784073157.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_8_1768784073869.jpg'
  ] AS urls
),
facilities_ranked AS (
  SELECT 
    id,
    name,
    ROW_NUMBER() OVER (ORDER BY id) - 1 as idx  -- 0부터 시작
  FROM facilities
  WHERE category = 'funeral_home'
    AND CAST(images AS TEXT) LIKE '%funeral_real%'
),
facilities_with_images AS (
  SELECT 
    fr.id,
    fr.name,
    fr.idx,
    -- 첫 번째 이미지: idx를 8로 나눈 나머지 (0~7)
    ip.urls[(fr.idx % 8) + 1] as img1,
    -- 두 번째 이미지: +3 offset
    ip.urls[((fr.idx + 3) % 8) + 1] as img2,
    -- 세 번째 이미지: +6 offset
    ip.urls[((fr.idx + 6) % 8) + 1] as img3
  FROM facilities_ranked fr
  CROSS JOIN image_pool ip
)
UPDATE facilities f
SET 
  images = ARRAY[fwi.img1, fwi.img2, fwi.img3]::text[],
  updated_at = NOW()
FROM facilities_with_images fwi
WHERE f.id = fwi.id;

-- ==========================================
-- 실행 후 확인
-- ==========================================

-- 1. 고유 대표 이미지 개수 (8개여야 함)
SELECT 
  COUNT(*) as "총_시설_수",
  COUNT(DISTINCT images[1]) as "고유_대표_이미지_수_기대값_8개"
FROM facilities
WHERE category = 'funeral_home'
  AND CAST(images AS TEXT) LIKE '%funeral_real%';

-- 2. 각 대표 이미지별 사용 시설 수 (균등하게 분배되어야 함)
SELECT 
  CASE 
    WHEN images[1] LIKE '%funeral_real_1_%' THEN 'funeral_real_1'
    WHEN images[1] LIKE '%funeral_real_2_%' THEN 'funeral_real_2'
    WHEN images[1] LIKE '%funeral_real_3_%' THEN 'funeral_real_3'
    WHEN images[1] LIKE '%funeral_real_4_%' THEN 'funeral_real_4'
    WHEN images[1] LIKE '%funeral_real_5_%' THEN 'funeral_real_5'
    WHEN images[1] LIKE '%funeral_real_6_%' THEN 'funeral_real_6'
    WHEN images[1] LIKE '%funeral_real_7_%' THEN 'funeral_real_7'
    WHEN images[1] LIKE '%funeral_real_8_%' THEN 'funeral_real_8'
  END as "대표_이미지",
  COUNT(*) as "사용_시설_수"
FROM facilities
WHERE category = 'funeral_home'
  AND CAST(images AS TEXT) LIKE '%funeral_real%'
GROUP BY images[1]
ORDER BY images[1];

-- 3. 샘플 20개 확인 (다양한 이미지가 보여야 함)
SELECT 
  name,
  CASE 
    WHEN images[1] LIKE '%funeral_real_1_%' THEN '이미지_1'
    WHEN images[1] LIKE '%funeral_real_2_%' THEN '이미지_2'
    WHEN images[1] LIKE '%funeral_real_3_%' THEN '이미지_3'
    WHEN images[1] LIKE '%funeral_real_4_%' THEN '이미지_4'
    WHEN images[1] LIKE '%funeral_real_5_%' THEN '이미지_5'
    WHEN images[1] LIKE '%funeral_real_6_%' THEN '이미지_6'
    WHEN images[1] LIKE '%funeral_real_7_%' THEN '이미지_7'
    WHEN images[1] LIKE '%funeral_real_8_%' THEN '이미지_8'
  END as "대표_이미지"
FROM facilities
WHERE category = 'funeral_home'
  AND CAST(images AS TEXT) LIKE '%funeral_real%'
ORDER BY id
LIMIT 20;

-- ==========================================
-- 📝 참고사항
-- ==========================================
-- 순환 방식 예시 (idx % 8):
-- 시설 0: 이미지 1 (0%8=0), 4 (3%8=3), 7 (6%8=6)
-- 시설 1: 이미지 2 (1%8=1), 5 (4%8=4), 8 (7%8=7)
-- 시설 2: 이미지 3 (2%8=2), 6 (5%8=5), 1 (8%8=0)
-- ...
-- 시설 7: 이미지 8 (7%8=7), 3 (10%8=2), 6 (13%8=5)
-- 시설 8: 이미지 1 (8%8=0), 4 (11%8=3), 7 (14%8=6)
-- 계속 순환...
--
-- 결과: 목록에서 보이는 대표 이미지가 8가지로 다양해짐!
