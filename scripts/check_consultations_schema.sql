-- consultations 테이블 스키마 확인 SQL 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. 컬럼 정보
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'consultations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. facility 관련 컬럼만 필터링
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'consultations' 
  AND table_schema = 'public'
  AND (column_name ILIKE '%facility%' OR column_name ILIKE '%memorial%')
ORDER BY ordinal_position;

-- 3. 샘플 데이터 (최근 5개)
SELECT *
FROM consultations
ORDER BY created_at DESC
LIMIT 5;

-- 4. 인덱스 정보
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'consultations' AND schemaname = 'public';

-- 5. 외래 키 정보
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'consultations'
  AND tc.constraint_type = 'FOREIGN KEY';
