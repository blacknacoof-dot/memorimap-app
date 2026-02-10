-- consultations 테이블 RLS 및 타입 확인
-- Supabase SQL Editor에서 실행

-- 1. facility_id 컬럼 타입 확인
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'consultations' 
  AND table_schema = 'public'
  AND column_name = 'facility_id';

-- 2. RLS 활성화 여부 확인
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'consultations';

-- 3. RLS 정책 목록 확인
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'consultations';

-- 4. 테이블 소유자 확인
SELECT 
  table_name,
  table_owner
FROM information_schema.tables
WHERE table_name = 'consultations' 
  AND table_schema = 'public';

-- 5. 테스트: facility_id로 직접 쿼리
-- (이 쿼리는 오류가 있으면 에러를 반환합니다)
SELECT * FROM consultations 
WHERE facility_id = 'ec725a14-68a4-4f52-b880-e1df86c2cd48'::uuid 
LIMIT 1;
