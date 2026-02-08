-- consultations 테이블 모든 컬럼 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'consultations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
