-- profiles 테이블 RLS 완전 해제 (디버깅용)
-- ⚠️ 주의: 보안상 위험하므로 테스트 후 반드시 복구하세요!

-- 방법 1: RLS 완전 비활성화 (즉시 해결)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT 
  tablename, 
  relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_tables t ON c.relname = t.tablename
WHERE tablename = 'profiles';
