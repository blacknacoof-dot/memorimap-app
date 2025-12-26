-- ==========================================================
-- [Final Unified Script] Schema & Permissions Setup
-- ==========================================================

-- PART 1: Schema Updates (Add missing columns & Fix Constraints)
-- ----------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 1. 기존 제약조건 제거 (중복 방지 및 갱신)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. 신규 통합 제약조건 추가 (모든 신규 역할 포함)
-- 이 부분이 실행되어야 sangjo_branch_manager, sangjo_hq_admin 등의 역할이 허용됩니다.
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN (
    'facility_admin',
    'pending_facility_admin',
    'sangjo_branch_manager',
    'sangjo_hq_admin',
    'sangjo_staff',
    'super_admin',
    'user'
  )
);

-- 3. 인덱스 추가 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);


-- PART 2: Security & RLS (Fix Infinite Recursion)
-- ----------------------------------------------------------
-- 슈퍼 관리자 여부를 안전하게 확인하는 함수
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE clerk_id = auth.uid()::text
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인의 프로필은 언제나 조회 가능
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = clerk_id);

-- 정책 2: 본인의 프로필은 수정 가능
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = clerk_id)
  WITH CHECK (auth.uid()::text = clerk_id);

-- 정책 3: 슈퍼 관리자는 모든 사용자 조회 가능
DROP POLICY IF EXISTS "Super Admins can view all users" ON users;
CREATE POLICY "Super Admins can view all users"
  ON users FOR SELECT
  USING (is_super_admin());

-- 정책 4: 슈퍼 관리자는 모든 사용자 역할 수정 가능
DROP POLICY IF EXISTS "Super Admins can update users" ON users;
CREATE POLICY "Super Admins can update users"
  ON users FOR UPDATE
  USING (is_super_admin());


-- PART 3: Super Admin Promotion
-- ----------------------------------------------------------
-- 특정 사용자를 슈퍼 관리자로 수동 승급 (필요시 실행)
-- UPDATE users SET role = 'super_admin' WHERE email = 'black22031@gmail.com';


-- PART 4: Utilities & Helper Functions
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';


-- PART 5: Funeral Companies Table (장례업체 정보)
-- ----------------------------------------------------------
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
DROP POLICY IF EXISTS "Anyone can view funeral companies" ON funeral_companies;
CREATE POLICY "Anyone can view funeral companies"
  ON funeral_companies FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
DROP POLICY IF EXISTS "Admins can manage funeral companies" ON funeral_companies;
CREATE POLICY "Admins can manage funeral companies"
  ON funeral_companies FOR ALL
  USING (is_super_admin());

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_funeral_companies_updated_at ON funeral_companies;
CREATE TRIGGER update_funeral_companies_updated_at
  BEFORE UPDATE ON funeral_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
