-- 1. 시설 테이블에 가격 범위 컬럼 추가
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS price_range TEXT;

-- 2. 기존 데이터가 있다면 마이그레이션 (필요시)
-- UPDATE public.facilities SET price_range = '가격 정보 상담' WHERE price_range IS NULL;

-- 3. 권한 확인 (RLS 정책에 따라 필요할 수 있음)
-- ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
-- (이미 정책이 설정되어 있다면 새로운 컬럼에 대해서도 적용됨)
