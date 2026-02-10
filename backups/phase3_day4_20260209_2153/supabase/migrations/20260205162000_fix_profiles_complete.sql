-- =============================================
-- Profiles 테이블 500 오류 완전 수정
-- =============================================
-- 모든 기존 정책 제거 후 새로 생성

BEGIN;

-- 1. 모든 기존 정책 제거
DROP POLICY IF EXISTS "profiles_select_by_clerk" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_by_clerk_fixed" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_fixed" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_fixed" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

-- 2. RLS 활성화 확인
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 권한 부여
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

-- 4. 새 정책 생성 - 간단하고 안정적인 버전

-- SELECT: 인증된 사용자는 자신의 프로필이나 모든 프로필 조회 가능
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- anon도 조회 가능
CREATE POLICY "profiles_select_anon" ON public.profiles
  FOR SELECT TO anon
  USING (true);

-- INSERT: 인증된 사용자만
CREATE POLICY "profiles_insert_auth" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: 인증된 사용자만
CREATE POLICY "profiles_update_auth" ON public.profiles
  FOR UPDATE TO authenticated
  USING (true);

-- DELETE: 인증된 사용자만
CREATE POLICY "profiles_delete_auth" ON public.profiles
  FOR DELETE TO authenticated
  USING (true);

COMMIT;

-- 검증
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
