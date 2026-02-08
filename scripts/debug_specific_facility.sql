-- ec725a14-68a4-4f52-b880-e1df86c2cd48 facility_id 테스트
-- 1. 이 ID로 consultations 데이터 확인
SELECT COUNT(*) as consultation_count 
FROM consultations 
WHERE facility_id = 'ec725a14-68a4-4f52-b880-e1df86c2cd48';

-- 2. 이 ID의 facilities 테이블 정보 확인
SELECT id, name, user_id 
FROM facilities 
WHERE id = 'ec725a14-68a4-4f52-b880-e1df86c2cd48';

-- 3. 이 시설에 대한 facility_admins 확인
SELECT * 
FROM facility_admins 
WHERE facility_id = 'ec725a14-68a4-4f52-b880-e1df86c2cd48';

-- 4. memorial_spaces에서 facilities_id로 조회
SELECT id, name, facilities_id 
FROM memorial_spaces 
WHERE facilities_id = 'ec725a14-68a4-4f52-b880-e1df86c2cd48';
