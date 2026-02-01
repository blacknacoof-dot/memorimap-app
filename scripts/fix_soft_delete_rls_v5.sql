-- ========================================================================
-- Facility Reviews 소프트 삭제 RLS 정책 최종 수정 스크립트 (V5)
-- ========================================================================
-- 문제 원인: UPDATE 정책의 WITH CHECK (true)가 특정 상황에서 소프트 삭제 시
-- 다른 SELECT 정책 등과 충돌하여 업데이트를 차단할 수 있음.
-- 해결책: WITH CHECK 절에 사용자 권한과 필드 변경 허용 범위를 명시적으로 정의.
-- ========================================================================

BEGIN;

-- 1. 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Users and admins can update reviews" ON public.facility_reviews;

-- 2. 새로운 UPDATE 정책 (소프트 삭제 명시 허용)
CREATE POLICY "Users and admins can update reviews"
ON public.facility_reviews
FOR UPDATE
TO authenticated
USING (
    user_id = (auth.jwt() ->> 'sub')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR user_id = 'system_funeral_migration'
)
WITH CHECK (
    -- 수정 후 행에 대한 검증 (본인 및 관리자 권한 유지 확인)
    (
        user_id = (auth.jwt() ->> 'sub')
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        OR user_id = 'system_funeral_migration'
    )
    AND (
        -- is_active 필드 변경 (소프트 삭제) 허용
        is_active = false 
        OR is_active = true
        OR is_active IS NULL
    )
);

COMMIT;

-- ===== 최종 확인 =====
DO $$ 
BEGIN
    RAISE NOTICE '✅ 소프트 삭제 정책 최종 수정 완료 (V5)';
END $$;
