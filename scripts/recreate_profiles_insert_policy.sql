-- profiles INSERT 정책 재생성
-- 기존 정책 삭제 후 재생성

DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- INSERT 정책: 인증된 사용자만 INSERT 가능 (WITH CHECK 완화)
CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- 모든 정책 확인
SELECT policyname, cmd, permissive, roles::text
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
