-- ============================================================
-- [Final V4] Atomic Schema & Policy Migration
-- 문제: RLS 정책 의존성으로 인한 UUID -> TEXT 변환 실패 해결
-- 전략: 정책 백업 -> 전체 삭제 -> 타입 변환 -> 최신 보안 정책 적용
-- ============================================================

DO $$
DECLARE
    pol_rec RECORD;
BEGIN
    -- 1. 모든 관련 정책 일시 삭제 (의존성 해제)
    FOR pol_rec IN (
        SELECT polname FROM pg_policy 
        WHERE polrelid = 'public.reviews'::regclass
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.reviews', pol_rec.polname);
    END LOOP;

    -- 2. 외래 키 제약 조건 삭제 (타입 변경 허용)
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_facility_id_fkey;
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_memorial_space_id_fkey;

    -- 3. 컬럼 타입 변경 (Clerk ID 및 하이브리드 ID 지원을 위해 TEXT로 변환)
    ALTER TABLE public.reviews 
      ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT,
      ALTER COLUMN facility_id TYPE TEXT USING facility_id::TEXT;

    -- 4. 사용자 이름 저장을 위한 컬럼 추가/확인
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='user_name') THEN
        ALTER TABLE public.reviews ADD COLUMN user_name TEXT;
    END IF;

    -- 5. 최신 보안 정책 재생성 (보안 강화 버전)
    -- 조회: 누구나 가능
    EXECUTE 'CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true)';
    
    -- 작성: 인증된 사용자만, 자신의 user_id로만 (Clerk ID 지원)
    EXECUTE 'CREATE POLICY "Authenticated users can insert reviews" 
             ON public.reviews FOR INSERT TO authenticated 
             WITH CHECK ((SELECT auth.uid())::text = user_id)';

    -- 삭제: 자신의 리뷰만
    EXECUTE 'CREATE POLICY "Users can delete own reviews" 
             ON public.reviews FOR DELETE TO authenticated 
             USING ((SELECT auth.uid())::text = user_id)';

END $$;

-- 최종 상태 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name IN ('user_id', 'facility_id', 'user_name');
