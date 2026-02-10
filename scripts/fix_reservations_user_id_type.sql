-- [긴급 수정] reservations 테이블 user_id 타입 변경
-- 문제: user_id가 UUID 타입이지만 Clerk ID는 UUID 형식이 아님
-- 해결: user_id를 TEXT 타입으로 변경

BEGIN;

-- 1. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "reservations_select_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_insert_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_delete_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_admin_all" ON public.reservations;

-- 2. 외래키 제약조건 삭제 (있다면)
ALTER TABLE public.reservations 
    DROP CONSTRAINT IF EXISTS fk_reservations_user;

-- 3. user_id 컬럼 타입 변경: UUID -> TEXT
ALTER TABLE public.reservations 
    ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 4. RLS 정책 재생성 (TEXT 타입에 맞게)
CREATE POLICY "reservations_select_own"
    ON public.reservations 
    FOR SELECT 
    TO authenticated 
    USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "reservations_insert_own"
    ON public.reservations 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "reservations_update_own"
    ON public.reservations 
    FOR UPDATE 
    TO authenticated 
    USING (user_id = auth.jwt() ->> 'sub')
    WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "reservations_delete_own"
    ON public.reservations 
    FOR DELETE 
    TO authenticated 
    USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "reservations_admin_all"
    ON public.reservations 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.clerk_id = auth.jwt() ->> 'sub'
            AND p.role = 'super_admin'
        )
    );

COMMIT;

-- 결과 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' AND column_name = 'user_id';
