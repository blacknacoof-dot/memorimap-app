-- 간단한 타입 확인
SELECT 
  table_name, 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name IN ('facilities', 'facility_admins', 'memorial_spaces') 
  AND table_schema = 'public'
  AND column_name IN ('id', 'facility_id', 'user_id')
ORDER BY table_name;
