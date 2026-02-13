-- ============================================
-- favorites + sangjo_favorites RLS 완전 수정
-- 문제: Clerk JWT 사용 시 auth.uid() = NULL, role = anon 가능
-- 해결: 역할 제한 없이 JWT sub 클레임 기반 정책
-- Date: 2026-02-13
-- ============================================

BEGIN;

-- =============================================
-- PART 1: favorites 테이블
-- =============================================

-- 기존 정책 전부 삭제
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE tablename = 'favorites'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.favorites', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- JWT sub = user_id 체크 (role 제한 없음 = anon + authenticated 모두 허용)
CREATE POLICY "fav_select" ON public.favorites
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "fav_insert" ON public.favorites
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "fav_delete" ON public.favorites
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

GRANT SELECT, INSERT, DELETE ON public.favorites TO anon;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;

-- =============================================
-- PART 2: sangjo_favorites 테이블
-- =============================================

-- 기존 정책 전부 삭제
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE tablename = 'sangjo_favorites'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.sangjo_favorites', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE public.sangjo_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sangjo_fav_select" ON public.sangjo_favorites
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "sangjo_fav_insert" ON public.sangjo_favorites
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "sangjo_fav_delete" ON public.sangjo_favorites
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

GRANT SELECT, INSERT, DELETE ON public.sangjo_favorites TO anon;
GRANT SELECT, INSERT, DELETE ON public.sangjo_favorites TO authenticated;

-- =============================================
-- 검증
-- =============================================
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('favorites', 'sangjo_favorites')
ORDER BY tablename, policyname;

COMMIT;
