-- memorial_spaces와 facilities 연결 (name 기준)
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 매핑 확인 (이미 연결된 것)
SELECT COUNT(*) as already_mapped
FROM memorial_spaces
WHERE facilities_id IS NOT NULL;

-- 2. 이름으로 매칭하여 facilities_id 업데이트
UPDATE memorial_spaces ms
SET facilities_id = f.id
FROM facilities f
WHERE ms.name = f.name
  AND ms.facilities_id IS NULL;

-- 3. 업데이트 결과 확인
SELECT 
  ms.id as memorial_id,
  ms.name as memorial_name,
  ms.facilities_id,
  f.id as facility_id,
  f.name as facility_name
FROM memorial_spaces ms
JOIN facilities f ON ms.facilities_id = f.id
ORDER BY ms.id
LIMIT 10;

-- 4. 여전히 매핑되지 않은 것 확인
SELECT 
  ms.id,
  ms.name,
  'Need manual mapping' as status
FROM memorial_spaces ms
WHERE ms.facilities_id IS NULL
ORDER BY ms.name;
