-- facilities 테이블에 memorial_spaces 데이터 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. facilities 테이블 필수 컬럼 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'facilities'
  AND table_schema = 'public'
ORDER BY ordinal_position;
