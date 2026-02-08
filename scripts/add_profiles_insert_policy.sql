-- profiles INSERT 정책 추가 (누락됨)
-- 인증된 사용자만 INSERT 가능

CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- 확인
SELECT policyname, cmd, permissive, roles::text
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
