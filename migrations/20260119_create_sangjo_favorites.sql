-- ============================================
-- 상조 회사 즐겨찾기 테이블 생성
-- Date: 2026-01-19
-- ============================================

BEGIN;

-- 1. sangjo_favorites 테이블 생성
CREATE TABLE IF NOT EXISTS public.sangjo_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,  -- Clerk user ID
    company_id TEXT NOT NULL,  -- constants.ts의 FuneralCompany.id (예: 'fc_new_1')
    company_name TEXT NOT NULL,  -- 회사명 (조회 성능을 위한 역정규화)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 중복 방지: 한 사용자가 같은 회사를 여러 번 즐겨찾기할 수 없음
    CONSTRAINT unique_user_company UNIQUE(user_id, company_id)
);

-- 2. 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_sangjo_favorites_user_id 
    ON public.sangjo_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_sangjo_favorites_company_id 
    ON public.sangjo_favorites(company_id);

CREATE INDEX IF NOT EXISTS idx_sangjo_favorites_created_at 
    ON public.sangjo_favorites(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE public.sangjo_favorites ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 설정

-- 정책 1: 사용자는 자신의 즐겨찾기만 조회
DROP POLICY IF EXISTS "Users can view their own sangjo favorites" ON public.sangjo_favorites;
CREATE POLICY "Users can view their own sangjo favorites"
    ON public.sangjo_favorites
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- 정책 2: 사용자는 즐겨찾기 추가 가능
DROP POLICY IF EXISTS "Users can insert their own sangjo favorites" ON public.sangjo_favorites;
CREATE POLICY "Users can insert their own sangjo favorites"
    ON public.sangjo_favorites
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- 정책 3: 사용자는 자신의 즐겨찾기만 삭제
DROP POLICY IF EXISTS "Users can delete their own sangjo favorites" ON public.sangjo_favorites;
CREATE POLICY "Users can delete their own sangjo favorites"
    ON public.sangjo_favorites
    FOR DELETE
    USING (auth.uid()::text = user_id);

-- 5. 테이블 설명 추가
COMMENT ON TABLE public.sangjo_favorites IS 
    '상조 회사 즐겨찾기 테이블 - constants.ts에 정의된 상조 회사에 대한 사용자 즐겨찾기';
COMMENT ON COLUMN public.sangjo_favorites.user_id IS 
    'Clerk 사용자 ID (TEXT)';
COMMENT ON COLUMN public.sangjo_favorites.company_id IS 
    'constants.ts의 FuneralCompany.id (예: fc_new_1, fc_post_1)';
COMMENT ON COLUMN public.sangjo_favorites.company_name IS 
    '회사명 (역정규화) - 조회 성능 향상을 위해 저장';

-- 6. 확인 쿼리
DO $$
BEGIN
    RAISE NOTICE '✅ sangjo_favorites 테이블 생성 완료';
    RAISE NOTICE '   - 테이블: public.sangjo_favorites';
    RAISE NOTICE '   - 인덱스: 3개 (user_id, company_id, created_at)';
    RAISE NOTICE '   - RLS 정책: 3개 (SELECT, INSERT, DELETE)';
END $$;

COMMIT;
