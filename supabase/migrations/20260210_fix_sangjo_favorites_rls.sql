-- ============================================
-- sangjo_favorites RLS 정책 정리 (12개 → 3개)
-- 문제: 중복 정책 12개 + auth.uid() vs auth.jwt() 충돌
-- 해결: 전부 삭제 후 auth.jwt()->> 'sub' 기반 3개만 생성
-- Date: 2026-02-10
-- ============================================

BEGIN;

-- 1. 기존 정책 12개 전부 삭제
DROP POLICY IF EXISTS "sangjo_favorites_select_by_owner" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_favorites_insert_by_owner" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_favorites_delete_by_owner" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_favorites_update_by_owner" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Users can add sangjo favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Users can view their sangjo favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Users can delete their sangjo favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_favorites_select" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_favorites_insert" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_favorites_delete" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Users can view their sangjo_favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Users can delete their sangjo_favorites" ON public.sangjo_favorites;
-- catch-all for any other stale policies
DROP POLICY IF EXISTS "Enable users to view their own sangjo favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Enable users to insert their own sangjo favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Enable users to delete their own sangjo favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Users can view their own sangjo favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Users can insert their own sangjo favorites" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "Users can delete their own sangjo favorites" ON public.sangjo_favorites;

-- 2. RLS 활성화 확인
ALTER TABLE public.sangjo_favorites ENABLE ROW LEVEL SECURITY;

-- 3. 새 정책 3개만 생성 (Clerk JWT 호환)
CREATE POLICY "sangjo_fav_select"
    ON public.sangjo_favorites
    FOR SELECT
    TO authenticated
    USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "sangjo_fav_insert"
    ON public.sangjo_favorites
    FOR INSERT
    TO authenticated
    WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "sangjo_fav_delete"
    ON public.sangjo_favorites
    FOR DELETE
    TO authenticated
    USING ((auth.jwt() ->> 'sub') = user_id);

-- 4. 검증
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'sangjo_favorites';

COMMIT;
