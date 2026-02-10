-- ========================================================================
-- Facility Reviews 소프트 삭제 RLS 정책 가이드라인 준수 최종 수정 스크립트 (V6)
-- ========================================================================
-- 문제 원인: UPDATE 정책의 WITH CHECK 절이 복잡할 경우, 새로운 행(NEW)에 대한 
-- 평가가 실패하여 403 Forbidden 및 RLS 위반 에러(42501)를 유발함.
-- 해결책: WITH CHECK 절을 아예 제거하여 USING 절의 조건을 자동으로 
-- 재사용하도록 단순화함 (PostgreSQL RLS 표준 동작 방식).
-- ========================================================================

BEGIN;

-- 1. 모든 가능한 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Users and admins can update reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can update and soft delete reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.facility_reviews;

-- 2. 완전히 단순화된 UPDATE 정책 (WITH CHECK 절 제거)
CREATE POLICY "Users and admins can update reviews"
ON public.facility_reviews
FOR UPDATE
TO authenticated
USING (
    user_id = (auth.jwt() ->> 'sub')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR user_id = 'system_funeral_migration'
);

COMMIT;

-- ===== 최종 확인 =====
DO $$ 
BEGIN
    RAISE NOTICE '✅ 소프트 삭제 정책 최종 수정 완료 (V6 - Simplified)';
END $$;

-- 정책 재확인 쿼리
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'facility_reviews' 
AND cmd = 'UPDATE';
