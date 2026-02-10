-- ========================================================================
-- Facility Reviews RLS 정책 최종 통합 해결 스크립트 (V7.1 - ENUM 대응)
-- ========================================================================
-- user_role ENUM 값: user, facility_manager, sangjo_manager, super_admin
-- ========================================================================

BEGIN;

-- 1. 기존 모든 정책 삭제
DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users and admins can update reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users and admins can delete reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.facility_reviews;

-- 2. SELECT (조회): 활성 리뷰는 누구나, 전체는 관리자
CREATE POLICY "Anyone can view active reviews"
ON public.facility_reviews FOR SELECT
USING (
    is_active = true 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE clerk_id = (auth.jwt() ->> 'sub') 
        AND role::text IN ('facility_manager', 'sangjo_manager', 'super_admin')
    )
);

-- 3. INSERT (작성): 인증된 사용자 전용
CREATE POLICY "Authenticated users can insert"
ON public.facility_reviews FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() ->> 'sub') IS NOT NULL
    OR user_id = 'system_funeral_migration'
);

-- 4. UPDATE (수정): 본인 및 관리자
CREATE POLICY "Users and admins can update reviews"
ON public.facility_reviews FOR UPDATE
TO authenticated
USING (
    user_id = (auth.jwt() ->> 'sub')
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE clerk_id = (auth.jwt() ->> 'sub') 
        AND role::text IN ('facility_manager', 'sangjo_manager', 'super_admin')
    )
    OR user_id = 'system_funeral_migration'
);

-- 5. DELETE (삭제): 본인 및 관리자
CREATE POLICY "Users and admins can delete reviews"
ON public.facility_reviews FOR DELETE
TO authenticated
USING (
    user_id = (auth.jwt() ->> 'sub')
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE clerk_id = (auth.jwt() ->> 'sub') 
        AND role::text IN ('facility_manager', 'sangjo_manager', 'super_admin')
    )
    OR user_id = 'system_funeral_migration'
);

COMMIT;

-- ===== 최종 확인 =====
DO $$ 
BEGIN
    RAISE NOTICE '✅ V7.1 ENUM-aware RLS 정책 적용 완료';
    RAISE NOTICE '관리자 권한: facility_manager, sangjo_manager, super_admin';
END $$;

-- 정책 목록 확인
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'facility_reviews';
