-- Enable RLS (if not already)
ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow INSERT for authenticated users (Clerk users via Supabase auth)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON partner_inquiries;
CREATE POLICY "Enable insert for authenticated users"
ON partner_inquiries FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Allow SELECT for users to see their own inquiries (optional but good practice)
DROP POLICY IF EXISTS "Enable select for own inquiries" ON partner_inquiries;
CREATE POLICY "Enable select for own inquiries"
ON partner_inquiries FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);
