-- Reclassify 청아공원 from cemetery to columbarium
-- 파일: 20260120_reclassify_cheonga_park.sql

-- ============================================
-- 1. 청아공원 조회 (현재 상태 확인)
-- ============================================

SELECT 
    id,
    name,
    category,
    address
FROM facilities 
WHERE name LIKE '%청아공원%' OR name LIKE '%청아%';

-- ============================================
-- 2. 재분류: 공원묘지 → 봉안시설
-- ============================================

UPDATE facilities 
SET category = 'columbarium'
WHERE name LIKE '%청아공원%'
  AND category = 'cemetery';

-- ============================================
-- 3. 결과 확인
-- ============================================

SELECT 
    id,
    name,
    category,
    address
FROM facilities 
WHERE name LIKE '%청아공원%';

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '청아공원 재분류 완료';
    RAISE NOTICE 'cemetery (공원묘지) → columbarium (봉안시설)';
    RAISE NOTICE '========================================';
END $$;
