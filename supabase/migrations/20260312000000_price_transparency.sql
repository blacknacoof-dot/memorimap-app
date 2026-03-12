-- 1. facilities 테이블에 가격 투명화 필드 추가
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS price_transparency BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS price_verified_at TIMESTAMPTZ;

-- 2. funeral_companies(상조)에도 동일 적용
ALTER TABLE funeral_companies
  ADD COLUMN IF NOT EXISTS price_transparency BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS price_verified_at TIMESTAMPTZ;

-- 3. 인덱스 (검색 필터용)
CREATE INDEX IF NOT EXISTS idx_facilities_price_transparency
  ON facilities(price_transparency) WHERE price_transparency = TRUE;
