
BEGIN;

-- 1. Drop existing policies that depend on the column types
DROP POLICY IF EXISTS "Users can submit inquiries" ON partner_inquiries;
DROP POLICY IF EXISTS "Users can insert their own inquiries" ON partner_inquiries;
DROP POLICY IF EXISTS "Users can view their own inquiries" ON partner_inquiries;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON partner_inquiries;
DROP POLICY IF EXISTS "Admins can update inquiries" ON partner_inquiries;
DROP POLICY IF EXISTS "Users can create inquiries" ON partner_inquiries;

-- 2. Map Clerk ID to Profile UUID (Data Cleanup)
-- Join with profiles on clerk_id and set user_id to profiles.id
UPDATE partner_inquiries pi
SET user_id = p.id::text
FROM profiles p
WHERE pi.user_id = p.clerk_id;

-- 3. Delete remaining invalid IDs (Legacy/Mock data)
-- These are users who don't have a profile row or are legacy garbage
DELETE FROM partner_inquiries
WHERE user_id IS NOT NULL 
AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 4. Alter column to UUID
ALTER TABLE partner_inquiries
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 5. Add Foreign Key Constraint
ALTER TABLE partner_inquiries
ADD CONSTRAINT fk_partner_inquiries_profile
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- 6. Re-create RLS Policies with UUID casting and standard naming

ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own inquiries
CREATE POLICY "partner_inquiries_insert_authenticated"
ON partner_inquiries FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')::uuid
);

-- Policy: Users can view their own inquiries
CREATE POLICY "partner_inquiries_select_own"
ON partner_inquiries FOR SELECT
TO authenticated
USING (
  user_id = (auth.jwt() ->> 'sub')::uuid
);

-- Policy: Admins can view all inquiries
CREATE POLICY "partner_inquiries_select_admin"
ON partner_inquiries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = (auth.jwt() ->> 'sub')::uuid
      AND p.role IN ('super_admin', 'sangjo_hq_admin')
  )
);

-- Policy: Super Admins can update inquiries (e.g. approve/reject)
CREATE POLICY "partner_inquiries_update_admin"
ON partner_inquiries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = (auth.jwt() ->> 'sub')::uuid
      AND p.role = 'super_admin'
  )
);

COMMIT;
