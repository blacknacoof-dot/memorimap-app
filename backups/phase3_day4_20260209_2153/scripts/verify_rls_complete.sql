-- Phase 1-4: RLS Policy Verification Script
-- 모든 테이블의 RLS 상태 확인

SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 각 테이블의 정책 목록
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- partner_conversations 테이블 존재 여부 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'partner_conversations'
) as table_exists;

-- 중요 테이블별 RLS 정책 상세 확인

-- === profiles 테이블 RLS 정책 ===
SELECT 'profiles' as table_name, * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';

-- === consultations 테이블 RLS 정책 ===
SELECT 'consultations' as table_name, * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'consultations';

-- === facilities 테이블 RLS 정책 ===
SELECT 'facilities' as table_name, * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'facilities';

-- === partner_conversations 테이블 RLS 정책 ===
SELECT 'partner_conversations' as table_name, * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partner_conversations';
