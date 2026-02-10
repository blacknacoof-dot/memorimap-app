-- memorial_spaces에 facilities_id 컬럼 추가 및 데이터 마이그레이션
-- Supabase SQL Editor에서 실행하세요

-- ==========================================
-- 1. 컬럼 추가
-- ==========================================
ALTER TABLE memorial_spaces 
ADD COLUMN IF NOT EXISTS facilities_id UUID REFERENCES facilities(id);

-- ==========================================
-- 2. 인덱스 생성
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_memorial_spaces_facilities_id 
ON memorial_spaces(facilities_id);

-- ==========================================
-- 3. 데이터 마이그레이션 (이름으로 매칭)
-- ==========================================
-- memorial_spaces와 facilities의 name이 일치하는 경우 매핑
UPDATE memorial_spaces ms
SET facilities_id = f.id
FROM facilities f
WHERE ms.name = f.name
  AND ms.facilities_id IS NULL;

-- ==========================================
-- 4. 마이그레이션 결과 확인
-- ==========================================
SELECT 
  ms.id as memorial_space_id,
  ms.name,
  ms.facilities_id,
  f.id as matched_facility_id,
  f.name as facility_name
FROM memorial_spaces ms
LEFT JOIN facilities f ON ms.facilities_id = f.id
ORDER BY ms.id
LIMIT 20;

-- ==========================================
-- 5. 매칭되지 않은 데이터 확인
-- ==========================================
SELECT 
  ms.id,
  ms.name,
  'No matching facility' as status
FROM memorial_spaces ms
WHERE ms.facilities_id IS NULL
ORDER BY ms.id;
