-- ========================================================================
-- Facility Reviews RLS 정책 최종 수정
-- ========================================================================
-- 목적: 상조 리뷰 삭제/수정 시 403 오류 해결 및 관리자 권한 부여
-- ========================================================================

BEGIN;

-- ===== STEP 1: 기존 정책 및 기타 충돌 해결 =====
DROP POLICY IF EXISTS "Users can soft delete own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews or admins" ON public.facility_reviews;
DROP POLICY IF EXISTS "Authenticated users can delete reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.facility_reviews;

-- [추가] memorial_spaces 테이블에 updated_at 컬럼이 없어 트리거 에러가 발생하는 문제 해결
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='memorial_spaces' AND column_name='updated_at') THEN
        ALTER TABLE public.memorial_spaces ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ memorial_spaces 테이블에 updated_at 컬럼 추가 완료';
    END IF;
END $$;

-- 로그 출력
DO $$ 
BEGIN
    RAISE NOTICE '✅ 기존 정책 삭제 완료';
END $$;

-- ===== STEP 2: SELECT 정책 (조회) =====
-- 일반 사용자: is_active = true인 리뷰만 조회
-- 관리자: 모든 리뷰 조회 가능
CREATE POLICY "Anyone can view active reviews"
ON public.facility_reviews
FOR SELECT
USING (
    is_active = true  -- 활성 리뷰는 누구나 조회 가능
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'  -- 관리자는 전체 조회
);

DO $$ 
BEGIN
    RAISE NOTICE '✅ SELECT 정책 생성 완료';
END $$;

-- ===== STEP 3: INSERT 정책 (작성) =====
-- 인증된 사용자만 리뷰 작성 가능
CREATE POLICY "Authenticated users can insert"
ON public.facility_reviews
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL
    OR user_id = 'system_funeral_migration'  -- 시스템 마이그레이션 허용
);

DO $$ 
BEGIN
    RAISE NOTICE '✅ INSERT 정책 생성 완료';
END $$;

-- ===== STEP 4: UPDATE 정책 (수정 및 소프트 삭제) =====
-- 본인 또는 관리자만 수정 가능
-- WITH CHECK (true)로 설정하여 is_active = false로 변경 허용
CREATE POLICY "Users and admins can update reviews"
ON public.facility_reviews 
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()::text  -- 본인 리뷰
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'  -- 관리자
    OR 
    user_id = 'system_funeral_migration'  -- 시스템 생성 리뷰
)
WITH CHECK (true);  -- 소프트 삭제를 위해 모든 변경 허용

DO $$ 
BEGIN
    RAISE NOTICE '✅ UPDATE 정책 생성 완료 (소프트 삭제 포함)';
END $$;

-- ===== STEP 5: DELETE 정책 (실제 삭제) =====
-- 본인 또는 관리자만 실제 삭제 가능
CREATE POLICY "Users and admins can delete reviews"
ON public.facility_reviews
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()::text  -- 본인 리뷰
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'  -- 관리자
    OR 
    user_id = 'system_funeral_migration'  -- 시스템 생성 리뷰
);

DO $$ 
BEGIN
    RAISE NOTICE '✅ DELETE 정책 생성 완료';
END $$;

-- ===== STEP 6: RLS 활성화 확인 =====
ALTER TABLE public.facility_reviews ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    RAISE NOTICE '✅ RLS 활성화 확인 완료';
END $$;

-- ===== STEP 7: 최종 정책 확인 =====
DO $$ 
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'facility_reviews';
    
    RAISE NOTICE '=== RLS 정책 수정 완료 ===';
    RAISE NOTICE '총 정책 개수: %', policy_count;
    RAISE NOTICE '예상 정책: SELECT(1) + INSERT(1) + UPDATE(1) + DELETE(1) = 4개';
    
    IF policy_count != 4 THEN
        RAISE WARNING '정책 개수가 예상과 다릅니다. 확인이 필요합니다.';
    END IF;
END $$;

-- 정책 목록 출력 (확인용)
SELECT 
    policyname,
    cmd,
    roles,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Anyone can view active reviews'
        WHEN cmd = 'INSERT' THEN 'Authenticated users can insert'
        WHEN cmd = 'UPDATE' THEN 'Users and admins can update reviews'
        WHEN cmd = 'DELETE' THEN 'Users and admins can delete reviews'
    END as description
FROM pg_policies 
WHERE tablename = 'facility_reviews'
ORDER BY cmd;

COMMIT;

-- 완료 메시지
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS 정책 업데이트 성공!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '1. 브라우저에서 리뷰 삭제 테스트';
    RAISE NOTICE '2. 403 오류 발생 여부 확인';
    RAISE NOTICE '3. verify_reviews_deletion.ts 실행';
    RAISE NOTICE '';
END $$;
