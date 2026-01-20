-- Fix partner_inquiries UUID type mismatch for Clerk Integration (Corrected)

-- 1. Drop existing RLS policies (user_id 컬럼 의존성 제거)
DROP POLICY IF EXISTS "Enable select for own submissions" ON partner_inquiries;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON partner_inquiries;
DROP POLICY IF EXISTS "Enable read access for all users" ON partner_inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON partner_inquiries;
DROP POLICY IF EXISTS "Users can insert own inquiries" ON partner_inquiries;

-- 2. Change user_id column type from UUID to TEXT
-- (기존 데이터가 있다면 안전하게 텍스트로 변환됩니다)
ALTER TABLE partner_inquiries
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 3. Add comment for documentation
COMMENT ON COLUMN partner_inquiries.user_id IS 'Clerk user ID (TEXT format, e.g., user_xxxxx)';

-- 4. Recreate RLS policies (수정된 부분: auth.uid() 대신 jwt 사용)
-- auth.uid()는 UUID 강제 형변환 오류를 일으키므로 사용하지 않습니다.

CREATE POLICY "Enable select for own submissions"
ON partner_inquiries
FOR SELECT
USING (
  (select auth.jwt() ->> 'sub') = user_id
);

CREATE POLICY "Enable insert for authenticated users"
ON partner_inquiries
FOR INSERT
WITH CHECK (
  (select auth.jwt() ->> 'sub') = user_id
);

-- 5. Verify the change
DO $$
BEGIN
    RAISE NOTICE 'Successfully converted partner_inquiries.user_id to TEXT';
    RAISE NOTICE 'RLS policies recreated using auth.jwt() ->> sub for Clerk compatibility';
END $$;
