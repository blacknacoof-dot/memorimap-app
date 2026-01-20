-- Fix 401 Unauthorized error for partner_inquiries
-- Issue: RLS INSERT policy requires auth.uid() match, but Clerk auth might not be integrated

-- Option 1: Temporarily allow all authenticated users to insert
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON partner_inquiries;

CREATE POLICY "Enable insert for authenticated users"
ON partner_inquiries
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow any authenticated user to insert

-- Option 2: Keep the user_id check but make it optional
-- Uncomment this if you want stricter control
/*
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON partner_inquiries;

CREATE POLICY "Enable insert for authenticated users"
ON partner_inquiries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id OR user_id IS NOT NULL);
*/

-- Verify policies
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'partner_inquiries'
AND cmd = 'INSERT';
