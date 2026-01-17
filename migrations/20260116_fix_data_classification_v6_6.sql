-- ============================================================
-- Migration v6.6: Data Re-classification
-- Purpose: Fix mislabeled categories based on facility names
-- ============================================================

-- 1. [봉안시설/납골당] 이름에 '봉안', '납골', '추모관'이 있으면 -> 'columbarium'
UPDATE facilities 
SET category = 'columbarium' 
WHERE (name LIKE '%봉안%' OR name LIKE '%납골%' OR name LIKE '%추모관%');

-- 2. [자연장/수목장] 이름에 '자연장', '수목장', '잔디장'이 있으면 -> 'natural_burial'
UPDATE facilities 
SET category = 'natural_burial' 
WHERE (name LIKE '%자연장%' OR name LIKE '%수목장%' OR name LIKE '%잔디장%' OR name LIKE '%숲%');

-- 3. [공원묘지/추모공원] 이름에 '공원', '묘지', '묘원'이 있으면 -> 'cemetery'
-- (단, 위에서 이미 columbarium으로 분류된 것은 건드리지 않음)
UPDATE facilities 
SET category = 'cemetery' 
WHERE (name LIKE '%공원%' OR name LIKE '%묘지%' OR name LIKE '%묘원%')
  AND category NOT IN ('columbarium', 'natural_burial');

-- 4. [동물장례] 이름에 '동물', '펫'이 있으면 -> 'pet_funeral'
UPDATE facilities 
SET category = 'pet_funeral' 
WHERE (name LIKE '%동물%' OR name LIKE '%펫%');

-- 5. [해양장] 이름에 '해양'이 있으면 -> 'sea_burial'
UPDATE facilities 
SET category = 'sea_burial' 
WHERE (name LIKE '%해양%');

-- 6. [장례식장] 이름에 '장례식장', '병원'이 있으면 -> 'funeral_home' (가장 마지막에 확실한 것만)
UPDATE facilities 
SET category = 'funeral_home' 
WHERE (name LIKE '%장례식장%' OR name LIKE '%병원%');

-- 결과 확인: 각 카테고리별로 데이터가 몇 개씩 정리되었는지 확인
SELECT category, COUNT(*) as count FROM facilities GROUP BY category;
