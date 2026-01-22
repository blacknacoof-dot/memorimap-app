-- Allow Super Admin (blacknacoof@gmail.com) to see ALL partner inquiries
-- Currently, RLS only allows users to see their own.

DROP POLICY IF EXISTS "Enable select for super admins" ON partner_inquiries;

CREATE POLICY "Enable select for super admins"
ON partner_inquiries FOR SELECT
TO authenticated
USING (
    -- Trust the email in the JWT (Clerk verified)
    (auth.jwt() ->> 'email') = 'blacknacoof@gmail.com'
);
