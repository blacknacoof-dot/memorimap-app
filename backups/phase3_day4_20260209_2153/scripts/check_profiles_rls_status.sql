-- profiles 테이블 RLS 상태 확인
-- 1. RLS 활성화 여부 확인
SELECT 
  tablename, 
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_tables t ON c.relname = t.tablename
WHERE tablename = 'profiles';

-- 2. 현재 적용된 정책 확인
SELECT 
  policyname,
  cmd,
  permissive,
  roles::text as roles,
  qual::text as using_expr,
  with_check::text as with_check_expr
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. 테이블 오너 확인
SELECT 
  tableowner
FROM pg_tables 
WHERE tablename = 'profiles';
