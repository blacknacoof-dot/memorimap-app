-- ==========================================
-- Supabase RLS Fix: Infinite Recursion Solution
-- ==========================================

-- 1. Create a secure function to check admin status
-- This function runs as the database owner (SECURITY DEFINER), bypassing RLS
-- This prevents the "Infinite Recursion" error.
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

-- 2. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = clerk_id);

-- 4. Policy: Super Admins can view ALL users (Using the function)
DROP POLICY IF EXISTS "Super Admins can view all users" ON users;
CREATE POLICY "Super Admins can view all users"
  ON users FOR SELECT
  USING (is_super_admin());

-- 5. Policy: Super Admins can update users (Using the function)
DROP POLICY IF EXISTS "Super Admins can update users" ON users;
CREATE POLICY "Super Admins can update users"
  ON users FOR UPDATE
  USING (is_super_admin());

-- ==========================================
-- 6. Promote Yourself (If not already done)
-- ==========================================
-- UPDATE users SET role = 'super_admin' WHERE email = 'YOUR_EMAIL@EXAMPLE.COM';
