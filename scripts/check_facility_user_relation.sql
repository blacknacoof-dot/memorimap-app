-- facilities 테이블 사용자 연결 확인
-- 1. facilities 테이블의 사용자 관련 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'facilities' 
  AND table_schema = 'public'
  AND (column_name ILIKE '%user%' OR column_name ILIKE '%owner%' OR column_name ILIKE '%manager%' OR column_name ILIKE '%admin%');

-- 2. facility_admins 테이블 구조 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'facility_admins' 
  AND table_schema = 'public';

-- 3. 특정 user_id로 facility_admins 조회 (테스트용)
-- 사용자의 Clerk ID나 UUID로 시설 조회
SELECT * FROM facility_admins LIMIT 5;

-- 4. facilities와 facility_admins 조인 예시
SELECT f.*, fa.user_id as admin_user_id
FROM facilities f
JOIN facility_admins fa ON f.id = fa.facility_id
LIMIT 5;
