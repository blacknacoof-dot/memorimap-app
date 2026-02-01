-- ==========================================
-- [Atomic Fix] Reviews Table Schema & Policy Migration
-- Purpose: Resolve 0A000 (Policy Dependency) error 
--          by dropping policies before type conversion.
-- ==========================================

DO $$
DECLARE
    pol_rec RECORD;
BEGIN
    -- 1. 모든 정책 일시적 삭제 (reviews 테이블 관련)
    FOR pol_rec IN (
        SELECT polname 
        FROM pg_policy 
        WHERE polrelid = 'public.reviews'::regclass
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.reviews', pol_rec.polname);
    END LOOP;

    -- 2. 외래 키 제약 조건 삭제
    EXECUTE 'ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey';
    EXECUTE 'ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_facility_id_fkey';
    EXECUTE 'ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_memorial_space_id_fkey';

    -- 3. 컬럼 타입 변경 (UUID/BIGINT -> TEXT)
    EXECUTE 'ALTER TABLE public.reviews ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT';
    EXECUTE 'ALTER TABLE public.reviews ALTER COLUMN facility_id TYPE TEXT USING facility_id::TEXT';

    -- 4. 부족한 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='user_name') THEN
        EXECUTE 'ALTER TABLE public.reviews ADD COLUMN user_name TEXT';
    END IF;

    -- 5. 정책 재생성 (공개 조회 + 누구나 작성 가능)
    -- [주의] user_id가 TEXT이므로 (SELECT auth.uid())::text = user_id 형태로 비교 가능해집니다.
    EXECUTE 'CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Anyone can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true)';

    -- 6. (선택) 본인 리뷰 삭제 정책 추가
    EXECUTE 'CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid()::text = user_id::text)';

END $$;

-- 최종 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name IN ('user_id', 'facility_id');
