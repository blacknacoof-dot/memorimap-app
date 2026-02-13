-- consultations 테이블에 category 컬럼 추가 (카테고리별 1건 제한용)
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS category TEXT;

-- 기존 데이터 notes 기반 category 추정 업데이트
UPDATE public.consultations SET category = 'funeral' WHERE category IS NULL AND notes ILIKE '%장례식장%';
UPDATE public.consultations SET category = 'memorial' WHERE category IS NULL AND notes ILIKE '%추모시설%';
UPDATE public.consultations SET category = 'pet' WHERE category IS NULL AND (notes ILIKE '%반려동물%' OR notes ILIKE '%동물장례%');

-- 인덱스 추가 (카테고리별 조회 성능)
CREATE INDEX IF NOT EXISTS idx_consultations_user_category ON public.consultations(user_id, category, status);
