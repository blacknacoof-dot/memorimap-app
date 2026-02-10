-- 컬럼 타입 정확히 확인
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name IN ('facilities', 'facility_admins') 
  AND table_schema = 'public'
  AND column_name IN ('id', 'facility_id', 'user_id')
ORDER BY table_name, ordinal_position;

-- 타입 변환해서 조인 테스트
-- facilities.id가 uuid이고 facility_admins.facility_id가 bigint라면
SELECT f.id as facility_uuid_id, 
       f.name,
       fa.facility_id as admin_facility_bigint_id,
       fa.user_id
FROM facilities f
JOIN facility_admins fa ON f.id::text = fa.facility_id::text
LIMIT 5;

-- 또는 반대로 bigint -> uuid 변환
SELECT f.id, f.name, fa.user_id
FROM facilities f
JOIN facility_admins fa ON f.id = fa.facility_id::uuid
LIMIT 5;
