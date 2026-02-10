-- 직접 쿼리 테스트
-- 1. 해당 facility_id로 consultations 조회 (RLS 우회)
SELECT * FROM consultations 
WHERE facility_id = 'ec725a14-68a4-4f52-b880-e1df86c2cd48'
ORDER BY created_at DESC
LIMIT 5;

-- 2. 데이터 존재 여부 확인
SELECT COUNT(*) as count 
FROM consultations 
WHERE facility_id = 'ec725a14-68a4-4f52-b880-e1df86c2cd48';

-- 3. facility_id 값 샘플 확인 (어떤 값들이 있는지)
SELECT DISTINCT facility_id 
FROM consultations 
LIMIT 10;
