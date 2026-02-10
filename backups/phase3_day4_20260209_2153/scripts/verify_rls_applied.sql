-- RLS 정책 적용 후 검증 쿼리

-- 1. partner_conversations 정책 확인
SELECT 
  'partner_conversations' as table_name,
  policyname, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || left(qual::text, 100)
    ELSE 'N/A'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || left(with_check::text, 100)
    ELSE 'N/A'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'partner_conversations'
ORDER BY cmd, policyname;

-- 2. profiles 정책 확인
SELECT 
  'profiles' as table_name,
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- 3. consultations 정책 확인
SELECT 
  'consultations' as table_name,
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'consultations'
ORDER BY cmd;

-- 4. facilities 정책 확인
SELECT 
  'facilities' as table_name,
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'facilities'
  AND cmd = 'UPDATE';

-- 5. 모든 테이블 RLS 활성화 상태 확인
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'partner_conversations', 'consultations', 'facilities')
ORDER BY tablename;
