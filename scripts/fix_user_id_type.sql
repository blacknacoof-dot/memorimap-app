-- ========================================================================
-- Facility Reviews user_id 컬럼 타입 변경 (v2 - 정책 의존성 해결)
-- ========================================================================
-- 문제: RLS 정책이 user_id 컬럼에 의존하고 있어 타입 변경이 실패함
-- 해결: 의존하는 모든 정책을 삭제 -> 타입 변경 -> 정책 재생성
-- ========================================================================

BEGIN;

-- ===== STEP 1: 모든 의존 정책 삭제 =====
-- (이미 생성했던 정책들과 기계적인 정책들 모두 삭제)
DROP POLICY IF EXISTS "Users and admins can update reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users and admins can delete reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.facility_reviews;
DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.facility_reviews; -- 중복 삭제 대비

-- 혹시 모를 다른 이름의 정책들도 삭제 (이전 스크립트 기반)
DROP POLICY IF EXISTS "Users can soft delete own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews or admins" ON public.facility_reviews;
DROP POLICY IF EXISTS "Authenticated users can delete reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Public Read Access" ON public.facility_reviews;
DROP POLICY IF EXISTS "Super Admin Manage All" ON public.facility_reviews;
DROP POLICY IF EXISTS "User Create Review" ON public.facility_reviews;
DROP POLICY IF EXISTS "User Update Own Review" ON public.facility_reviews;
DROP POLICY IF EXISTS "User Delete Own Review" ON public.facility_reviews;

DO $$ 
BEGIN
    RAISE NOTICE '✅ 모든 의존 RLS 정책 삭제 완료';
END $$;

-- ===== STEP 2: user_id를 TEXT로 변경 =====
ALTER TABLE public.facility_reviews 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

DO $$ 
BEGIN
    RAISE NOTICE '✅ user_id 컬럼을 TEXT 타입으로 변경 완료';
END $$;

-- ===== STEP 3: 최신 RLS 정책 전면 재생성 =====

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
    auth.uid() IS NOT NULL
    OR user_id = 'system_funeral_migration'
);

-- 3. UPDATE (수정 및 소프트 삭제)
CREATE POLICY "Users and admins can update reviews"
ON public.facility_reviews 
FOR UPDATE
TO authenticated
USING (
    user_id = (SELECT auth.uid()::text)  -- 안전하게 text 캐스팅
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
    user_id = (SELECT auth.uid()::text)
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR 
    user_id = 'system_funeral_migration'
);

DO $$ 
BEGIN
    RAISE NOTICE '✅ 모든 RLS 정책 재생성 완료 (TEXT 타입 반영)';
END $$;

-- ===== STEP 4: 최종 검증 =====
DO $$ 
DECLARE
    new_type TEXT;
BEGIN
    SELECT data_type INTO new_type
    FROM information_schema.columns
    WHERE table_name = 'facility_reviews' 
    AND column_name = 'user_id';
    
    RAISE NOTICE '종료 후 user_id 타입: %', new_type;
    
    IF new_type != 'text' THEN
        RAISE EXCEPTION '타입 변경 실패!';
    END IF;
END $$;

COMMIT;

-- 완료 메시지
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ 정책 의존성 해결 및 타입 변경 성공!';
    RAISE NOTICE '========================================';
END $$;
