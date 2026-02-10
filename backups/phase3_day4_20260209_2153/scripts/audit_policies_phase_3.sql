-- Phase 3 시작 전, 클리닝 대상 테이블 및 정책 확인
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND (
    roles @> '{public}'::name[] 
    OR roles @> '{anon}'::name[] 
    OR qual = 'true' 
    OR with_check = 'true'
  )
  AND tablename NOT IN ('profiles', 'facility_subscriptions', 'funeral_companies', 'profile_public_view') -- 이미 처리된 테이블 제외
ORDER BY tablename;
