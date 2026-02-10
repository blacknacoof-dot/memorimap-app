-- facilities 테이블 unique constraint 확인
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'facilities'
  AND tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');

-- 또는 이름 중복 체크만 하고 INSERT (ON CONFLICT 없이)
SELECT 
  ms.id,
  ms.name,
  f.id as existing_facility_id
FROM memorial_spaces ms
LEFT JOIN facilities f ON ms.name = f.name
WHERE f.id IS NULL
  AND ms.name IS NOT NULL
ORDER BY ms.name
LIMIT 20;
