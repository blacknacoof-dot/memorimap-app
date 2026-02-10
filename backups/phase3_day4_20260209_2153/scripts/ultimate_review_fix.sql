-- [Ultimate Fix V3] 테이블 이름 변경 (Rename) 전략
-- PostgREST의 스키마 캐시를 완전히 무효화하기 위해 테이블 이름을 바꿔서 새로 생성합니다.

-- 1. 기존 reviews 테이블 이름 변경 (백업 겸임)
ALTER TABLE IF EXISTS reviews RENAME TO reviews_old;

-- 2. 새로운 reviews 테이블 생성 (처음부터 TEXT 타입으로)
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,  -- Clerk ID 수용을 위해 TEXT
    facility_id TEXT, -- 상조 ID 수용을 위해 TEXT
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    user_name TEXT
);

-- 3. RLS(보안 정책) 활성화
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 4. 보안 정책 재설정
CREATE POLICY "Public can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reviews" ON public.reviews
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id IS NOT NULL 
        AND facility_id IS NOT NULL 
        AND (SELECT auth.uid())::text = user_id
    );

CREATE POLICY "Users can delete own reviews" ON public.reviews
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid())::text = user_id);

-- 5. 기존 데이터 복원 (reviews_old -> reviews)
-- 만약 reviews_old가 존재할 경우에만 실행됩니다.
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews_old') THEN
        INSERT INTO public.reviews (id, user_id, facility_id, rating, content, images, created_at, user_name)
        SELECT id, user_id, facility_id, rating, content, images, created_at, user_name 
        FROM reviews_old;
    END IF;
END $$;

-- 6. 데이터 확인 (기존 201개가 잘 복구되었는지 확인)
-- SELECT COUNT(*) FROM reviews;

-- 7. (필요시) 옛날 테이블 삭제 - 모든 것이 확인된 후 실행하세요.
-- DROP TABLE reviews_old;

-- 8. PostgREST 캐시 강제 리로드
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_notify('pgrst', 'reload schema');
