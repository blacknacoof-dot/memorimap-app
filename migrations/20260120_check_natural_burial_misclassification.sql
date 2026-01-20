-- Check and fix misclassified natural burial facilities
-- 파일: 20260120_check_natural_burial_misclassification.sql

-- ============================================
-- 1. 확인 대상 시설 조회
-- ============================================

SELECT 
    id,
    name,
    category,
    address
FROM facilities 
WHERE name IN (
    '화성나래원 분양사무실',
    '전곡감리교회',
    '어승생한울누리공원',
    '올리베따노성베네딕도수도원',
    '천주교인보성체수도회',
    '용천바다'
)
ORDER BY name;

-- ============================================
-- 2. 자연장 카테고리 내 오분류 시설 검색
-- ============================================

-- 분양사무실, 교회, 수도원 등 키워드 검색
SELECT 
    id,
    name,
    category,
    address
FROM facilities 
WHERE category = 'natural_burial'
  AND (
      name LIKE '%분양%' OR
      name LIKE '%사무실%' OR
      name LIKE '%교회%' OR
      name LIKE '%수도원%' OR
      name LIKE '%수도회%' OR
      name LIKE '%바다%'  -- 해양장으로 변경 필요
  )
ORDER BY name;

-- ============================================
-- 3. 삭제 대상 (자연장과 무관한 시설)
-- ============================================

-- 실행 전 확인: 아래 시설들은 자연장이 아니므로 삭제 필요
-- - 화성나래원 분양사무실
-- - 전곡감리교회  
-- - 올리베따노성베네딕도수도원
-- - 천주교인보성체수도회

-- ============================================
-- 4. 재분류 대상 (다른 카테고리로 변경)
-- ============================================

-- 용천바다: natural_burial → sea_burial
-- UPDATE facilities 
-- SET category = 'sea_burial'
-- WHERE name = '용천바다' AND category = 'natural_burial';

-- ============================================
-- 참고: 카테고리 목록
-- ============================================
-- funeral_home: 장례식장
-- columbarium: 봉안시설
-- cemetery: 공원묘지
-- natural_burial: 자연장
-- pet_funeral: 동물장묘
-- sea_burial: 해양장
-- sangjo: 상조
