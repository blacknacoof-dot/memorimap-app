
-- favorites 테이블의 user_id 타입을 TEXT로 변경하는 SQL (수정본)
-- 기존 테이블을 삭제하고 새로 만듭니다.

-- 1. 기존 테이블 삭제
DROP TABLE IF EXISTS public.favorites;

-- 2. 새 테이블 생성 (user_id TEXT)
CREATE TABLE public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, 
    facility_id BIGINT REFERENCES public.memorial_spaces(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, facility_id)
);

-- 3. RLS 활성화
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 4. 정책 설정 (개발용: 누구나 CRUD 가능하도록 설정)
-- 추후 인증 로직이 확실해지면 'auth.uid() = user_id' 또는 JWT 서브젝트 비교로 강화해야 합니다.

DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites" 
ON public.favorites FOR SELECT 
TO public
USING ( true ); 

DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
CREATE POLICY "Users can insert own favorites" 
ON public.favorites FOR INSERT 
TO public
WITH CHECK ( true );

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites" 
ON public.favorites FOR DELETE 
TO public
USING ( true );

-- 5. 권한 부여
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
GRANT ALL ON public.favorites TO anon; -- 필요시 anon 역할에도 권한 부여
