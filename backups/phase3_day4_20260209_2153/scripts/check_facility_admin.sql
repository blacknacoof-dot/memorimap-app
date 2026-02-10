-- facility_admins 권한 확인
-- 1. 특정 사용자가 어떤 시설에 등록되어 있는지 확인
-- auth.uid()는 현재 로그인한 사용자의 UUID를 반환합니다

-- 테스트용: 현재 로그인한 사용자 ID 확인
SELECT auth.uid() as current_user_id;

-- 테스트용: facility_admins 전체 목록
SELECT * FROM facility_admins LIMIT 10;

-- 특정 facility_id에 대한 관리자 목록
SELECT * FROM facility_admins 
WHERE facility_id::text = 'ec725a14-68a4-4f52-b880-e1df86c2cd48';

-- consultations 테이블에 해당 facility_id 데이터가 있는지 확인
SELECT * FROM consultations 
WHERE facility_id = 'ec725a14-68a4-4f52-b880-e1df86c2cd48'
LIMIT 5;
