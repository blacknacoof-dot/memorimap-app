-- RLS 정책 전체 내용 확인
SELECT 
  policyname,
  cmd,
  permissive,
  roles::text as roles,
  qual::text as filter_condition,
  with_check::text as check_condition
FROM pg_policies 
WHERE tablename = 'consultations'
ORDER BY policyname;
