-- facilities 테이블과의 관계 확인
-- 1. facilities 테이블이 있는지 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('facilities', 'memorial_spaces');

-- 2. facilities 테이블이 있다면 구조 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'facilities' 
  AND table_schema = 'public';

-- 3. consultations.facility_id가 facilities 테이블의 id를 참조하는지 확인
-- 샘플 facility_id로 facilities 테이블 조회
SELECT * FROM facilities 
WHERE id IN (
  SELECT facility_id::uuid 
  FROM consultations 
  LIMIT 5
);

-- 4. memorial_spaces와 consultations 연결 확인
-- consultations.facility_id 중에서 숫자로 변환 가능한 값이 있는지
SELECT facility_id 
FROM consultations 
WHERE facility_id ~ '^[0-9]+$' 
LIMIT 5;
