-- Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 1. Insert Policy
-- First drop to avoid "policy already exists" error
DROP POLICY IF EXISTS "Enable insert for everyone" ON leads;

CREATE POLICY "Enable insert for everyone" ON leads
    FOR INSERT
    WITH CHECK (true);

-- 2. Select Policy
DROP POLICY IF EXISTS "Enable select for own leads" ON leads;

CREATE POLICY "Enable select for own leads" ON leads
    FOR SELECT
    USING (auth.uid() = user_id);
