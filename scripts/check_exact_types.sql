-- 정확한 컬럼 타입 확인
SELECT 
  table_name, 
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name IN ('facilities', 'facility_admins', 'memorial_spaces') 
  AND table_schema = 'public'
  AND column_name IN ('id', 'facility_id', 'user_id', 'owner_user_id', 'manager_id')
ORDER BY table_name, ordinal_position;

-- 각 테이블의 id 샘플 값 확인
SELECT 'facilities' as table_name, id::text as id_sample
FROM facilities LIMIT 1;

SELECT 'memorial_spaces' as table_name, id::text as id_sample  
FROM memorial_spaces LIMIT 1;

SELECT 'facility_admins' as table_name, facility_id::text as facility_id_sample
FROM facility_admins LIMIT 1;
