-- [DEBUG FIX] Reset Profiles RLS Completely
-- 이 스크립트는 혼재된 모든 정책 이름들을 찾아 삭제하고,
-- 가장 확실한 단일 정책 세트를 적용하여 RLS 설정 오류를 배제합니다.

BEGIN;

-- 1. 기존 정책 이름들 모두 삭제 (알려진 모든 패턴)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_auth" ON profiles;
DROP POLICY IF EXISTS "profiles_update_auth" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_auth" ON profiles;

DROP POLICY IF EXISTS "profiles_select_anon" ON profiles;

-- 2. RLS 활성화 확인
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. 권한 부여 (확실하게)
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT SELECT ON profiles TO anon;

-- 4. [DEBUG] 매우 관대한 정책 적용 (Authenticated Only)
-- 로그인만 되어 있다면 무조건 허용 (JWT Payload 검사 생략)
-- 이 상태에서도 401이 뜬다면, 그것은 RLS 문제가 아니라 '토큰 자체'가 유효하지 않은 것입니다.

-- SELECT: 누구나 (anon 포함)
CREATE POLICY "profiles_select_debug" ON profiles
  FOR SELECT USING (true);

-- INSERT: 인증된 유저 허용
CREATE POLICY "profiles_insert_debug" ON profiles
  FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE: 인증된 유저 허용
CREATE POLICY "profiles_update_debug" ON profiles
  FOR UPDATE TO authenticated USING (true);

COMMIT;

-- 검증 쿼리
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
