-- [Task] 시설 데이터 정밀 정화 및 고도화 (Final Cleanup)
-- 1. 중복/부실 데이터 삭제
-- 2. 부실 명칭 정규화 (~관리사무실, ~입구 제거)
-- 3. 중복 지점 통합 (가산면공설묘지, 관인면공설묘지 등)

BEGIN;

-- [보완] 상조 회사 데이터를 별도의 카테고리로 명확히 분리 (추후 대시보드 연동을 위함)
UPDATE memorial_spaces 
SET category = 'sangjo'
WHERE name LIKE '%상조%' 
   OR name LIKE '%프리드라이프%' 
   OR name LIKE '%대명스테이션%' 
   OR name LIKE '%보람상조%' 
   OR name LIKE '%교원라이프%';

-- 1. 단순 삭제 (Cleanup)
DELETE FROM memorial_spaces 
WHERE id IN (1530, 1775, 1608);
-- 1530: 강화서해장례문화원 (부적합)
-- 1775: 뱅크25 ATM (가비지)
-- 1608: M병원장례식장 (휴업)

-- 2. 명칭 정규화 (Normalization)
-- 불필요한 접미사 제거하여 브랜드명 단일화
UPDATE memorial_spaces 
SET name = '갑산공원묘원', address = '경기도 양평군 서종면 수능리 산10-1'
WHERE id = 359; -- '갑산공원묘원 관리사무실' -> '갑산공원묘원'

UPDATE memorial_spaces 
SET name = '계룡장례식장'
WHERE id = 489; -- '계룡장례식장 입구' -> '계룡장례식장'

-- 3. 중복 지점 대표화 및 통합 (Consolidation)
-- 가산면제1공설묘지 (4개 지점 -> 1개 통합)
DELETE FROM memorial_spaces 
WHERE id IN (1730, 1731, 1732);
UPDATE memorial_spaces SET name = '가산면제1공설묘지 (통합)' WHERE id = 1729;

-- 관인면공설묘지 (2개 지점 -> 1개 통합)
DELETE FROM memorial_spaces WHERE id = 1804;
UPDATE memorial_spaces SET name = '관인면공설묘지' WHERE id = 1803;

-- 거창사건추모공원 (부속 지점 6개 통합)
-- 안내실, 위령탑 등 복잡한 지점을 대표 지점으로 통합
DELETE FROM memorial_spaces 
WHERE name LIKE '%거창사건추모공원%' 
  AND (name LIKE '%안내실%' OR name LIKE '%위령탑%' OR name LIKE '%참배광장%' OR name LIKE '%자유무대%');

-- 결과 확인용 (f_count 변수는 psql/pg용이므로 주석 처리하거나 단순 출력용으로만 인지)
-- SELECT count(*) FROM memorial_spaces;

COMMIT;
