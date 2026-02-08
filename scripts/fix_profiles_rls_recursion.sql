-- [FINAL FIX] Profiles RLS Infinite Recursion (500 Error Fix)
-- 'profiles' 테이블의 정책이 자기 자신을 다시 조회하여 발생하는 재귀 호출 문제를 해결합니다.

BEGIN;

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- 2. 새 SELECT 정책 (재귀 제거)
-- Super Admin 확인을 위해 profiles 테이블을 다시 조회하는 대신,
-- 일단 단순하게 본인 확인만 하거나, JWT의 sub와 일치하는지만 확인합니다.
-- (가장 안전하고 단순한 버전)

CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
TO authenticated
USING (
    -- 1. 본인 조회
    clerk_id = auth.jwt() ->> 'sub'
    
    -- 2. (옵션) Super Admin 전체 조회 - 재귀 방지
    -- 아래 구문이 재귀를 일으킬 수 있으므로, 500 에러가 난다면 일단 주석 처리합니다.
    -- 또는 security definer 함수를 써야 하는데 현재는 안정화가 우선이므로 제외합니다.
    /*
    OR EXISTS (
      SELECT 1 FROM profiles p2 
      WHERE p2.clerk_id = auth.jwt() ->> 'sub' 
      AND p2.role = 'super_admin'
    )
    */
);

COMMIT;

SELECT 'Profiles recursion fixed. Super admin check temporarily disabled for stability.' as result;
