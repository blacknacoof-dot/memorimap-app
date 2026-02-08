-- profiles 테이블 RLS 정책 완화
-- INSERT 시 모든 authenticated 사용자 허용 (clerk_id는 application에서 검증)

-- 기존 정책 정리
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- INSERT: 모든 인증된 사용자 허용 (애플리케이션에서 clerk_id 검증)
CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- SELECT: 본인 조회 + super_admin 전체 조회
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
TO authenticated
USING (
  clerk_id = auth.jwt() ->> 'sub'
  OR EXISTS (
    SELECT 1 FROM profiles p2 
    WHERE p2.clerk_id = auth.jwt() ->> 'sub' 
    AND p2.role = 'super_admin'
  )
);

-- UPDATE: 본인만 수정 가능
CREATE POLICY "profiles_update_policy"
ON profiles FOR UPDATE
TO authenticated
USING (clerk_id = auth.jwt() ->> 'sub')
WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- 확인
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
