-- =============================================
-- Fix Reviews RLS Policy
-- Reason: memorial_space_id column does not exist. Use facility_id instead.
-- =============================================

-- 1. 기존 정책 삭제 (존재하는 경우)
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public read access" ON public.reviews;

-- 2. 새로운 공개 조회 정책 생성
CREATE POLICY "Public can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

-- 3. 로그
SELECT 'Reviews RLS Policy fixed to public access' as message;
