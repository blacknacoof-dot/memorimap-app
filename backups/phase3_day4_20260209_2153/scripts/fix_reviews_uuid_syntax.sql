-- 1. 외래 키 제약 조건 제거 (타입 변경을 위해 필수)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_facility_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_memorial_space_id_fkey;

-- 2. 컬럼 타입 변경 (UUID/BIGINT -> TEXT)
-- USING 절을 사용하여 기존 데이터를 안전하게 캐스팅합니다.
ALTER TABLE public.reviews 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT,
  ALTER COLUMN facility_id TYPE TEXT USING facility_id::TEXT;

-- 3. 부족한 컬럼 추가 (만약 없을 경우를 대비)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 4. RLS 정책 업데이트 (새로운 타입에 맞춰 재등록)
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
CREATE POLICY "Anyone can insert reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

-- 확인 로그
SELECT 'Reviews table updated: user_id and facility_id are now TEXT' as status;
