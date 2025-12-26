-- Phase 1: Add role system to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update role check constraint to include 'pending_facility_admin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'pending_facility_admin', 'facility_admin', 'super_admin'));

-- Add facility ownership
ALTER TABLE memorial_spaces ADD COLUMN IF NOT EXISTS owner_user_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_memorial_spaces_owner ON memorial_spaces(owner_user_id);

-- Note: RLS policies are already set to allow all users to read/write
-- The application logic will handle role-based access control
