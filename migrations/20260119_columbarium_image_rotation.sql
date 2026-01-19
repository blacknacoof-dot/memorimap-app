-- ==========================================
-- 봉안시설 이미지 일괄 할당
-- Columbarium Image Rotation Assignment
-- ==========================================
-- 생성일: 2026-01-19
-- 대상: 152개 기본 이미지 사용 봉안시설

-- ==========================================
-- [1] 실행 전 백업
-- ==========================================
CREATE TABLE IF NOT EXISTS columbarium_backup_20260119 AS 
SELECT * FROM facilities WHERE category = 'columbarium';

-- 백업 확인
SELECT COUNT(*) as "백업된_봉안시설_수" FROM columbarium_backup_20260119;

-- ==========================================
-- [2] 업데이트 대상 확인
-- ==========================================
SELECT 
  COUNT(*) as "업데이트_대상_수"
FROM facilities
WHERE category = 'columbarium'
  AND (
    CAST(images AS TEXT) LIKE '%charnel_final_%'
    OR images IS NULL
    OR ARRAY_LENGTH(images, 1) = 0
  );

-- ==========================================
-- [3] 13개 이미지를 순환 방식으로 할당
-- ==========================================
WITH image_pool AS (
  SELECT ARRAY[
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_1_1768786509477.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_2_1768786511144.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_3_1768786511562.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_4_1768786512019.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_5_1768786512785.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_6_1768786513201.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_7_1768786513738.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_8_1768786514225.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_9_1768786514633.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_10_1768786515075.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_11_1768786515555.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_12_1768786515933.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_13_1768786516316.jpg'
  ] AS urls
),
facilities_ranked AS (
  SELECT 
    id,
    name,
    ROW_NUMBER() OVER (ORDER BY id) - 1 as idx
  FROM facilities
  WHERE category = 'columbarium'
    AND (
      CAST(images AS TEXT) LIKE '%charnel_final_%'
      OR images IS NULL
      OR ARRAY_LENGTH(images, 1) = 0
    )
),
facilities_with_images AS (
  SELECT 
    fr.id,
    fr.name,
    fr.idx,
    -- 13개 중 중복 없이 3개 선택 (각 시설마다 다른 조합)
    -- idx를 시드로 사용하여 일관성 유지하면서도 다양성 확보
    ip.urls[(fr.idx % 13) + 1] as img1,
    ip.urls[((fr.idx + 5) % 13) + 1] as img2,
    ip.urls[((fr.idx + 9) % 13) + 1] as img3
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
-- [4] 실행 후 확인
-- ==========================================

-- 4-1. 고유 대표 이미지 개수 (13개여야 함)
SELECT 
  COUNT(*) as "총_봉안시설_수",
  COUNT(DISTINCT images[1]) as "고유_대표_이미지_수_기대값_13개"
FROM facilities
WHERE category = 'columbarium'
  AND CAST(images AS TEXT) LIKE '%columbarium_real%';

-- 4-2. 각 대표 이미지별 사용 시설 수 (균등 분배 확인)
SELECT 
  CASE 
    WHEN images[1] LIKE '%columbarium_real_1_%' THEN 'columbarium_1'
    WHEN images[1] LIKE '%columbarium_real_2_%' THEN 'columbarium_2'
    WHEN images[1] LIKE '%columbarium_real_3_%' THEN 'columbarium_3'
    WHEN images[1] LIKE '%columbarium_real_4_%' THEN 'columbarium_4'
    WHEN images[1] LIKE '%columbarium_real_5_%' THEN 'columbarium_5'
    WHEN images[1] LIKE '%columbarium_real_6_%' THEN 'columbarium_6'
    WHEN images[1] LIKE '%columbarium_real_7_%' THEN 'columbarium_7'
    WHEN images[1] LIKE '%columbarium_real_8_%' THEN 'columbarium_8'
    WHEN images[1] LIKE '%columbarium_real_9_%' THEN 'columbarium_9'
    WHEN images[1] LIKE '%columbarium_real_10_%' THEN 'columbarium_10'
    WHEN images[1] LIKE '%columbarium_real_11_%' THEN 'columbarium_11'
    WHEN images[1] LIKE '%columbarium_real_12_%' THEN 'columbarium_12'
    WHEN images[1] LIKE '%columbarium_real_13_%' THEN 'columbarium_13'
  END as "대표_이미지",
  COUNT(*) as "사용_시설_수"
FROM facilities
WHERE category = 'columbarium'
  AND CAST(images AS TEXT) LIKE '%columbarium_real%'
GROUP BY images[1]
ORDER BY images[1];

-- 4-3. 샘플 20개 확인 (다양한 이미지 확인)
SELECT 
  name,
  CASE 
    WHEN images[1] LIKE '%columbarium_real_1_%' THEN '이미지_1'
    WHEN images[1] LIKE '%columbarium_real_2_%' THEN '이미지_2'
    WHEN images[1] LIKE '%columbarium_real_3_%' THEN '이미지_3'
    WHEN images[1] LIKE '%columbarium_real_4_%' THEN '이미지_4'
    WHEN images[1] LIKE '%columbarium_real_5_%' THEN '이미지_5'
    WHEN images[1] LIKE '%columbarium_real_6_%' THEN '이미지_6'
    WHEN images[1] LIKE '%columbarium_real_7_%' THEN '이미지_7'
    WHEN images[1] LIKE '%columbarium_real_8_%' THEN '이미지_8'
    WHEN images[1] LIKE '%columbarium_real_9_%' THEN '이미지_9'
    WHEN images[1] LIKE '%columbarium_real_10_%' THEN '이미지_10'
    WHEN images[1] LIKE '%columbarium_real_11_%' THEN '이미지_11'
    WHEN images[1] LIKE '%columbarium_real_12_%' THEN '이미지_12'
    WHEN images[1] LIKE '%columbarium_real_13_%' THEN '이미지_13'
  END as "대표_이미지"
FROM facilities
WHERE category = 'columbarium'
  AND CAST(images AS TEXT) LIKE '%columbarium_real%'
ORDER BY id
LIMIT 20;

-- 4-4. 기본 이미지가 남아있는지 확인 (0개여야 함)
SELECT 
  COUNT(*) as "남은_기본_이미지_수_기대값_0개"
FROM facilities
WHERE category = 'columbarium'
  AND CAST(images AS TEXT) LIKE '%charnel_final_%';

-- ==========================================
-- 📝 참고사항
-- ==========================================
-- 순환 방식 (13개 이미지):
-- 시설 0: 이미지 1 (0%13=0), 5 (4%13=4), 10 (9%13=9)
-- 시설 1: 이미지 2 (1%13=1), 6 (5%13=5), 11 (10%13=10)
-- 시설 2: 이미지 3 (2%13=2), 7 (6%13=6), 12 (11%13=11)
-- ...
-- 시설 12: 이미지 13 (12%13=12), 4 (16%13=3), 9 (21%13=8)
-- 시설 13: 이미지 1 (13%13=0), 5 (17%13=4), 10 (22%13=9)
-- 계속 순환...
--
-- 결과: 목록에서 13가지 다른 이미지로 다양성 확보!
