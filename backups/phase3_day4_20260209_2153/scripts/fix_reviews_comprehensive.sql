-- 1. user_name 컬럼 추가 (리뷰 작성자 이름)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 2. 기존 RLS 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public read access" ON public.reviews;

-- 3. 조회 정책: 모든 사람(익명 포함)이 리뷰를 볼 수 있게 허용
CREATE POLICY "Public can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

-- 4. 작성 정책: 모든 사람(익명 포함)이 리뷰를 작성할 수 있게 허용
-- (실제 운영 시에는 auth.uid()를 체크하는 것이 좋으나, 현재 요구사항에 맞춰 Anyone으로 설정)
CREATE POLICY "Anyone can insert reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (true);

-- 5. 업데이트/삭제 정책 (선택 사항: 본인 것만 가능하게 하거나 일단 막아둠)
-- 본인만 삭제 가능하도록 설정 (user_id 일치 시)
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews" 
ON public.reviews 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- 확인 로그
SELECT 'Reviews table schema and RLS policies updated successfully' as status;
