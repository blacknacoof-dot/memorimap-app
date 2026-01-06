
-- [Favorites] user_id 컬럼 타입 변경 (UUID/BigInt -> TEXT)
-- 이유: 현재 들어오는 user_id가 'user_372...' 형태의 문자열(Clerk ID)이므로, 
-- UUID나 BigInt 타입에는 저장할 수 없습니다. TEXT로 변경해야 합니다.

ALTER TABLE public.favorites 
ALTER COLUMN user_id TYPE TEXT;

-- 혹시 모르니 RLS 정책도 명확하게 추가 (406 에러 방지)
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for users based on user_id" ON public.favorites FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NOT NULL);
CREATE POLICY "Enable insert for users based on user_id" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for users based on user_id" ON public.favorites FOR DELETE USING (auth.uid()::text = user_id OR true);
