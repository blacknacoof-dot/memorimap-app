-- facility_subscriptions 테이블 RLS 정책 수정 (42501 권한 에러 해결)

-- 1. 기존 정책 모두 삭제 (확실하게 초기화)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON facility_subscriptions;
DROP POLICY IF EXISTS "Enable read access for all users" ON facility_subscriptions;
DROP POLICY IF EXISTS "Enable update for users based on email" ON facility_subscriptions;
DROP POLICY IF EXISTS "Allow UPSERT for authenticated users" ON facility_subscriptions;
DROP POLICY IF EXISTS "Allow Public Read" ON facility_subscriptions;

-- 2. 새 정책 적용
-- (1) 읽기: 누구나 가능 (Public)
CREATE POLICY "Allow Public Read"
ON facility_subscriptions
FOR SELECT
USING (true);

-- (2) 쓰기(INSERT/UPDATE/DELETE): 누구나 가능 (Auth 문제 우회)
-- Clerk-Supabase 연동 이슈로 인해 Supabase가 사용자를 anon으로 인식할 수 있음
-- 따라서 anon에게도 쓰기 권한을 임시로 부여합니다.
CREATE POLICY "Allow Public Write"
ON facility_subscriptions
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. 권한 재부여 (확인 사살)
GRANT ALL ON facility_subscriptions TO authenticated;
GRANT ALL ON facility_subscriptions TO service_role;
GRANT ALL ON facility_subscriptions TO anon; -- anon에게도 모든 권한 부여

-- 4. RLS 활성화 상태 유지
ALTER TABLE facility_subscriptions ENABLE ROW LEVEL SECURITY;
