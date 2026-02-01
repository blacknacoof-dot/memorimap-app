BEGIN;

-- 1. Favorites (Facilities)
-- Allow INSERT
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
CREATE POLICY "Users can add favorites" ON public.favorites
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid())::text = user_id);

-- Allow SELECT (View own favorites)
DROP POLICY IF EXISTS "Users can view their favorites" ON public.favorites;
CREATE POLICY "Users can view their favorites" ON public.favorites
    FOR SELECT TO authenticated
    USING ((select auth.uid())::text = user_id);

-- Allow DELETE (Remove favorites)
DROP POLICY IF EXISTS "Users can delete their favorites" ON public.favorites;
CREATE POLICY "Users can delete their favorites" ON public.favorites
    FOR DELETE TO authenticated
    USING ((select auth.uid())::text = user_id);


-- 2. Sangjo Favorites
-- Allow INSERT
DROP POLICY IF EXISTS "Users can add sangjo favorites" ON public.sangjo_favorites;
CREATE POLICY "Users can add sangjo favorites" ON public.sangjo_favorites
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid())::text = user_id);

-- Allow SELECT
DROP POLICY IF EXISTS "Users can view their sangjo favorites" ON public.sangjo_favorites;
CREATE POLICY "Users can view their sangjo favorites" ON public.sangjo_favorites
    FOR SELECT TO authenticated
    USING ((select auth.uid())::text = user_id);

-- Allow DELETE
DROP POLICY IF EXISTS "Users can delete their sangjo favorites" ON public.sangjo_favorites;
CREATE POLICY "Users can delete their sangjo favorites" ON public.sangjo_favorites
    FOR DELETE TO authenticated
    USING ((select auth.uid())::text = user_id);

COMMIT;
