-- profiles 테이블 RLS 정책 정리 및 수정
-- 중복 정책 제거하고 Clerk ID 호환 정책만 유지

-- 기존 정책 모두 정리
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "robust_profiles_select" ON profiles;
DROP POLICY IF EXISTS "robust_profiles_all" ON profiles;

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. INSERT 정책: 본인 프로필만 생성 (Clerk ID 호환)
CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- 2. SELECT 정책: 본인 프로필 조회 + super_admin 전체 조회
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

-- 3. UPDATE 정책: 본인 정볧� 수정 가능
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
