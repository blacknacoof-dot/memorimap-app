-- Phase 2: Supabase Schema for Memorial Spaces and Funeral Companies

-- ============================================
-- 1. Memorial Spaces Table (시설 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS memorial_spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('charnel', 'park', 'natural', 'complex', 'sea')),
  religion TEXT NOT NULL CHECK (religion IN ('none', 'christian', 'catholic', 'buddhism')),
  address TEXT NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  price_range TEXT,
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  image_url TEXT,
  description TEXT,
  features TEXT[],
  phone TEXT,
  prices JSONB DEFAULT '[]',
  gallery_images TEXT[],
  reviews JSONB DEFAULT '[]',
  naver_booking_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE memorial_spaces ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view memorial spaces"
  ON memorial_spaces FOR SELECT
  USING (true);

-- Only admins can insert/update/delete (you can customize this)
CREATE POLICY "Admins can manage memorial spaces"
  ON memorial_spaces FOR ALL
  USING (auth.uid()::text IN (
    SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
  ));

-- ============================================
-- 2. Funeral Companies Table (장례업체 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS funeral_companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  image_url TEXT,
  description TEXT,
  features TEXT[],
  phone TEXT,
  price_range TEXT,
  benefits TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE funeral_companies ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view funeral companies"
  ON funeral_companies FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage funeral companies"
  ON funeral_companies FOR ALL
  USING (auth.uid()::text IN (
    SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
  ));

-- ============================================
-- 3. Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_memorial_spaces_type ON memorial_spaces(type);
CREATE INDEX IF NOT EXISTS idx_memorial_spaces_religion ON memorial_spaces(religion);
CREATE INDEX IF NOT EXISTS idx_memorial_spaces_rating ON memorial_spaces(rating DESC);
CREATE INDEX IF NOT EXISTS idx_funeral_companies_rating ON funeral_companies(rating DESC);

-- ============================================
-- 4. Updated_at Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to memorial_spaces
DROP TRIGGER IF EXISTS update_memorial_spaces_updated_at ON memorial_spaces;
CREATE TRIGGER update_memorial_spaces_updated_at
  BEFORE UPDATE ON memorial_spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to funeral_companies
DROP TRIGGER IF EXISTS update_funeral_companies_updated_at ON funeral_companies;
CREATE TRIGGER update_funeral_companies_updated_at
  BEFORE UPDATE ON funeral_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
