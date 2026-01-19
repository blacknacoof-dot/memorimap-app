-- ============================================
-- 상조 회사 즐겨찾기 RLS 정책 수정 (Clerk ID 호환성)
-- Date: 2026-01-19
-- ============================================

BEGIN;

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own sangjo favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Users can insert their own sangjo favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Users can delete their own sangjo favorites" ON public.sangjo_favorites;

-- 2. 새 정책 생성
-- auth.uid()는 UUID를 반환하므로 Clerk ID(TEXT)와 호환되지 않음
-- 따라서 (auth.jwt() ->> 'sub')를 사용하여 TEXT 형태의 ID를 가져와야 함

-- 정책 1: 조회
CREATE POLICY "Enable users to view their own sangjo favorites"
    ON public.sangjo_favorites
    FOR SELECT
    USING (
        (auth.jwt() ->> 'sub') = user_id
    );

-- 정책 2: 추가
CREATE POLICY "Enable users to insert their own sangjo favorites"
    ON public.sangjo_favorites
    FOR INSERT
    WITH CHECK (
        (auth.jwt() ->> 'sub') = user_id
    );

-- 정책 3: 삭제
CREATE POLICY "Enable users to delete their own sangjo favorites"
    ON public.sangjo_favorites
    FOR DELETE
    USING (
        (auth.jwt() ->> 'sub') = user_id
    );

COMMENT ON TABLE public.sangjo_favorites IS 
    '상조 회사 즐겨찾기 테이블 - RLS 정책을 auth.jwt()->>sub로 수정하여 Clerk ID 지원';

-- 3. 호환성 확인용 함수 (옵션)
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::text;
$$;

DO $$
BEGIN
    RAISE NOTICE '✅ RLS 정책 수정 완료 (Auth.uid() -> Auth.jwt() ->> sub)';
END $$;

COMMIT;
