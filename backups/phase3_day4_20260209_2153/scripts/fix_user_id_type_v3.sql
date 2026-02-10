-- ========================================================================
-- Facility Reviews user_id 컬럼 타입 변경 및 RLS 수정 (v3 - 최종 안정화)
-- ========================================================================
-- 1. UUID -> TEXT 변환 (Clerk ID 지원)
-- 2. auth.uid() 캐스팅 에러 해결 (JWT sub 직접 사용)
-- 3. 정책 의존성 해결
-- ========================================================================

BEGIN;

-- ===== STEP 1: 모든 의존 정책 삭제 =====
DROP POLICY IF EXISTS "Users and admins can update reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users and admins can delete reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.facility_reviews;
DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can soft delete own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews or admins" ON public.facility_reviews;
DROP POLICY IF EXISTS "Authenticated users can delete reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Public Read Access" ON public.facility_reviews;
DROP POLICY IF EXISTS "Super Admin Manage All" ON public.facility_reviews;
DROP POLICY IF EXISTS "User Create Review" ON public.facility_reviews;
DROP POLICY IF EXISTS "User Update Own Review" ON public.facility_reviews;
DROP POLICY IF EXISTS "User Delete Own Review" ON public.facility_reviews;

-- ===== STEP 2: user_id를 TEXT로 변경 =====
-- 이미 TEXT일 수도 있으나 안전하게 재실행
ALTER TABLE public.facility_reviews 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- ===== STEP 3: 최신 RLS 정책 재생성 (sub 직접 사용으로 22P02 방지) =====

-- 1. SELECT (조회)
CREATE POLICY "Anyone can view active reviews"
ON public.facility_reviews
FOR SELECT
USING (
    is_active = true 
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 2. INSERT (작성)
CREATE POLICY "Authenticated users can insert"
ON public.facility_reviews
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() ->> 'sub') IS NOT NULL
    OR user_id = 'system_funeral_migration'
);

-- 3. UPDATE (수정 및 소프트 삭제)
-- auth.uid() 대신 (auth.jwt() ->> 'sub')를 사용하여 UUID 캐스팅 에러 방지
CREATE POLICY "Users and admins can update reviews"
ON public.facility_reviews 
FOR UPDATE
TO authenticated
USING (
    user_id = (auth.jwt() ->> 'sub')
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR 
    user_id = 'system_funeral_migration'
)
WITH CHECK (true);

-- 4. DELETE (실제 삭제)
CREATE POLICY "Users and admins can delete reviews"
ON public.facility_reviews
FOR DELETE
TO authenticated
USING (
    user_id = (auth.jwt() ->> 'sub')
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR 
    user_id = 'system_funeral_migration'
);

COMMIT;

-- 검증 및 로그
DO $$ 
DECLARE
    new_type TEXT;
BEGIN
    SELECT data_type INTO new_type
    FROM information_schema.columns
    WHERE table_name = 'facility_reviews' 
    AND column_name = 'user_id';
    
    RAISE NOTICE '✅ user_id 타입: %', new_type;
    RAISE NOTICE '✅ 22P02 에러 방지를 위한 JWT sub 기반 정책 적용 완료';
END $$;
