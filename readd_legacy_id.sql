-- [긴급 복구] legacy_id 컬럼 추가 (복구용)
-- 복구 스크립트 실행을 위해 필수입니다.

BEGIN;

-- 1. legacy_id 컬럼 다시 추가
ALTER TABLE public.facilities 
ADD COLUMN IF NOT EXISTS legacy_id TEXT;

-- 2. 인덱스 생성 (업데이트 속도 향상용)
CREATE INDEX IF NOT EXISTS idx_facilities_legacy_id ON public.facilities(legacy_id);

COMMIT;
