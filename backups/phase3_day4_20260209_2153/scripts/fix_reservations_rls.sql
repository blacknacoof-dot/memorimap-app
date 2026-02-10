-- [긴급 수정] reservations RLS 정책 개선
-- 문제: auth.jwt() ->> 'sub' 대신 auth.uid() 사용 및 타입 캐스팅 제거

BEGIN;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "reservations_insert_authenticated" ON public.reservations;
DROP POLICY IF EXISTS "reservations_manage_own_or_admin" ON public.reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can see their own reservations" ON public.reservations;

-- user_id 컬럼 타입 확인 및 수정 (필요시)
DO $$
DECLARE
    v_user_id_type TEXT;
BEGIN
    SELECT data_type INTO v_user_id_type
    FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'user_id';
    
    RAISE NOTICE 'reservations.user_id 타입: %', v_user_id_type;
END $$;

-- 개선된 RLS 정책: auth.uid() 사용 (auth.jwt() ->> 'sub' 대신)
-- auth.uid()는 UUID를 반환하므로 타입 캐스팅 불필요

-- 1. INSERT 정책: 인증된 사용자는 자신의 user_id로만 INSERT 가능
CREATE POLICY "reservations_insert_authenticated"
    ON public.reservations 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (user_id = auth.uid());

-- 2. SELECT/UPDATE/DELETE 정책: 소유자 또는 슈퍼관리자
CREATE POLICY "reservations_manage_own_or_admin"
    ON public.reservations 
    FOR ALL 
    TO authenticated 
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

-- 3. 익명 사용자는 접근 불가 (기본)
-- 필요시 아래 정책 추가:
-- CREATE POLICY "reservations_no_anon_access"
--     ON public.reservations FOR ALL TO anon USING (false);

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
ORDER BY policyname;
