
-- favorites 테이블 생성 및 RLS 설정 SQL
-- Supabase SQL Editor에서 실행해주세요.

-- 1. favorites 테이블 생성
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    facility_id BIGINT REFERENCES public.memorial_spaces(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, facility_id)
);

-- 2. RLS 활성화
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 3. 정책 설정 (기존 정책이 있다면 삭제 후 재생성)
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;

CREATE POLICY "Users can view own favorites" 
ON public.favorites FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" 
ON public.favorites FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" 
ON public.favorites FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 4. 권한 부여 (authenticated 역할이 테이블을 사용할 수 있도록)
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
