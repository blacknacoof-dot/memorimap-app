-- ==========================================
-- Cleanup Script: Undo RLS Changes
-- ==========================================

-- 1. Disable RLS (Stop the infinite loop error immediatey)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Drop the policies that were created
DROP POLICY IF EXISTS "Super Admins can update users" ON users;
DROP POLICY IF EXISTS "Super Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- 3. Drop the function if it was created
DROP FUNCTION IF EXISTS public.is_super_admin;
