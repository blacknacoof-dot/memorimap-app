-- [긴급 수정] reservations RLS 정책 - 사용자 권한 수정
-- 문제: 일반 사용자가 자신의 예약을 조회할 수 없음

BEGIN;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "reservations_insert_authenticated" ON public.reservations;
DROP POLICY IF EXISTS "reservations_manage_own_or_admin" ON public.reservations;

-- 1. INSERT 정책: 인증된 사용자는 자신의 user_id로만 INSERT 가능
CREATE POLICY "reservations_insert_own"
    ON public.reservations 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (user_id = auth.uid());

-- 2. SELECT 정책: 자신의 예약만 조회 가능
CREATE POLICY "reservations_select_own"
    ON public.reservations 
    FOR SELECT 
    TO authenticated 
    USING (user_id = auth.uid());

-- 3. UPDATE/DELETE 정책: 자신의 예약만 수정/삭제 가능
CREATE POLICY "reservations_update_own"
    ON public.reservations 
    FOR UPDATE 
    TO authenticated 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "reservations_delete_own"
    ON public.reservations 
    FOR DELETE 
    TO authenticated 
    USING (user_id = auth.uid());

-- 4. 슈퍼관리자 정책: 모든 작업 가능
CREATE POLICY "reservations_admin_all"
    ON public.reservations 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

COMMIT;

-- 결과 확인
SELECT 
    tablename, 
    policyname, 
    roles, 
    cmd, 
    qual
FROM pg_policies
WHERE tablename = 'reservations'
ORDER BY cmd, policyname;
