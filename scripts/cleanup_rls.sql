
-- Clean up RLS policies for 'favorites' table
-- 1. Drop all existing policies to remove duplicates and insecure ones
DROP POLICY IF EXISTS "Enable delete access for all users" ON favorites;
DROP POLICY IF EXISTS "Enable delete for users" ON favorites;
DROP POLICY IF EXISTS "Enable insert access for all users" ON favorites;
DROP POLICY IF EXISTS "Enable insert for users" ON favorites;
DROP POLICY IF EXISTS "Enable read access for all users" ON favorites;
DROP POLICY IF EXISTS "Enable read for users" ON favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view own favorites (Clerk)" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Public can view favorites" ON favorites;

-- 2. Re-create Essential Policies (Secure)

-- Enable RLS just in case
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see their own favorites
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- INSERT: Users can add their own favorites
CREATE POLICY "Users can add favorites" ON favorites
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- DELETE: Users can remove their own favorites
CREATE POLICY "Users can remove favorites" ON favorites
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Verify
-- SELECT * FROM pg_policies WHERE tablename = 'favorites';
