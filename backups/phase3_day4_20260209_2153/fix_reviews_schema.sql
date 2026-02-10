-- reviews 테이블이 이미 존재하지만 memorial_space_id 컬럼이 없는 경우를 위한 패치
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS memorial_space_id bigint REFERENCES public.memorial_spaces(id) ON DELETE CASCADE;

-- 캐시 새로고침 (중요)
NOTIFY pgrst, 'reload schema';
