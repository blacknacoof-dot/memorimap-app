-- Create sangjo_hq_admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS sangjo_hq_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, 
    sangjo_id TEXT NOT NULL, -- Changed to TEXT and removed FK to facilities(id) due to potential type mismatch
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sangjo_users table if it doesn't exist (for branch admins)
CREATE TABLE IF NOT EXISTS sangjo_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    sangjo_id TEXT NOT NULL, -- Changed to TEXT and removed FK
    branch_id TEXT, -- Changed to TEXT
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE sangjo_hq_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sangjo_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own role
DROP POLICY IF EXISTS "Allow users to read their own hq admin status" ON sangjo_hq_admins;
CREATE POLICY "Allow users to read their own hq admin status"
ON sangjo_hq_admins FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Allow users to read their own branch admin status" ON sangjo_users;
CREATE POLICY "Allow users to read their own branch admin status"
ON sangjo_users FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);
