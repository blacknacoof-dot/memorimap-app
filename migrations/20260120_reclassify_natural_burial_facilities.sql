-- Reclassify natural burial facilities (REVISED)
-- 파일: 20260120_reclassify_natural_burial_facilities.sql
-- 수정: 삭제 대신 올바른 카테고리로 재분류

-- ============================================
-- 1. 용천바다: 자연장 → 해양장
-- ============================================
UPDATE facilities 
SET category = 'sea_burial'
WHERE id = '38c3174d-ac2d-45e1-86c2-540f7ec9a11e'  -- 용천바다
  AND category = 'natural_burial';

-- ============================================
-- 2. 천주교 봉안당: 자연장 → 봉안시설
-- ============================================
UPDATE facilities 
SET category = 'columbarium'
WHERE id IN (
    '59078c21-61cf-4649-a0c0-488b297f7fd0',  -- 올리베따노성베네딕도수도원
    'fc9cdfbb-c782-4c8d-b764-593ba404f107'   -- 천주교인보성체수도회
)
AND category = 'natural_burial';

-- ============================================
-- 3. 기독교 수목장/봉안: 자연장 유지 (재검토)
-- ============================================
-- 용인로뎀파크: 수목장+봉안 복합 시설
-- → 현재 natural_burial 유지 (주 기능이 수목장이므로)
-- 필요 시 columbarium으로 재분류 가능

-- UPDATE facilities 
-- SET category = 'columbarium'  -- 또는 natural_burial 유지
-- WHERE id = 'c4281916-1899-4a3f-b677-9e6de1748756'  -- 용인로뎀파크 교회
-- AND category = 'natural_burial';

-- ============================================
-- 4. 기독교 전용묘역: 자연장 유지 또는 공원묘지
-- ============================================
-- 전곡감리교회: 기독교 전용묘역
-- → natural_burial 유지 권장 (교회 전용 자연장/수목장)

-- UPDATE facilities 
-- SET category = 'cemetery'  -- 공원묘지로 변경하려면
-- WHERE id = 'eb8b0d18-6180-40aa-98fc-e8ca439c8249'  -- 전곡감리교회
-- AND category = 'natural_burial';

-- ============================================
-- 5. 기독교 부속시설: 자연장 유지
-- ============================================
-- 선한목자교회, 함평교회: 교회 운영 묘역
-- → natural_burial 유지 (교회 자연장지)

-- ============================================
-- 6. 삭제: 분양사무실만 (시설이 아님)
-- ============================================
DELETE FROM facilities
WHERE id = '8562c9e4-4b3d-4d02-a0ab-7f8bbdcb25fb'  -- 화성나래원 분양사무실
  AND name LIKE '%분양사무실%';

-- ============================================
-- 7. 실행 결과 확인
-- ============================================
SELECT 
    category,
    COUNT(*) as count
FROM facilities
WHERE category IN ('natural_burial', 'sea_burial', 'columbarium', 'cemetery')
GROUP BY category
ORDER BY category;

-- 재분류된 시설 확인
SELECT 
    name,
    category,
    address
FROM facilities
WHERE id IN (
    '38c3174d-ac2d-45e1-86c2-540f7ec9a11e',  -- 용천바다 (sea_burial)
    '59078c21-61cf-4649-a0c0-488b297f7fd0',  -- 올리베따노성베네딕도수도원 (columbarium)
    'fc9cdfbb-c782-4c8d-b764-593ba404f107'   -- 천주교인보성체수도회 (columbarium)
)
ORDER BY name;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Natural burial facility reclassification complete';
    RAISE NOTICE '- Reclassified to sea_burial: 1 (용천바다)';
    RAISE NOTICE '- Reclassified to columbarium: 2 (천주교)';
    RAISE NOTICE '- Deleted: 1 (화성나래원 분양사무실)';
    RAISE NOTICE '- Church-operated natural burial sites: RETAINED';
    RAISE NOTICE '========================================';
END $$;
