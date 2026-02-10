-- [FINAL FIX] Profiles RLS Policies (SELECT, INSERT, UPDATE)
-- 401 오류가 키 문제가 아니라면 권한 문제일 수 있습니다.
-- Upsert(Insert + Update)가 가능하려면 INSERT와 UPDATE 정책이 모두 있어야 합니다.

BEGIN;

-- 1. 기존 정책 모두 삭제 (Clean Slate)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- 2. SELECT 정책 (본인 데이터 조회)
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
TO authenticated
USING (
    -- Clerk ID가 일치하거나
    clerk_id = auth.jwt() ->> 'sub'
    -- 또는 user_id가 일치하거나 (Supabase Auth 사용 시)
    OR id = auth.uid()
);

-- 3. INSERT 정책 (누구나 생성 가능 - 트리거로 검증 추천하지만 일단 허용)
-- Clerk에서 넘어온 유저는 아직 profiles에 없을 수 있으므로 INSERT가 되어야 함
CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. UPDATE 정책 (본인 데이터 수정)
CREATE POLICY "profiles_update_policy"
ON profiles FOR UPDATE
TO authenticated
USING (
    clerk_id = auth.jwt() ->> 'sub' OR id = auth.uid()
)
WITH CHECK (
    clerk_id = auth.jwt() ->> 'sub' OR id = auth.uid()
);

COMMIT;

-- 정책 확인
SELECT policyname, cmd, roles::text 
FROM pg_policies 
WHERE tablename = 'profiles';
