-- 1. Create Transactional RPC for Partner Approval and Role Upgrade
-- This ensures that if the inquiry is approved, the user role is GUARANTEED to be updated.
CREATE OR REPLACE FUNCTION approve_partner_and_grant_role(
    inquiry_id UUID,
    target_user_id TEXT -- Changed to TEXT (Clerk Compatibility)
) RETURNS VOID AS $$
BEGIN
    -- Update Inquiry Status
    UPDATE partner_inquiries
    SET status = 'approved'
    WHERE id = inquiry_id;

    -- Update User Role (if user_id exists)
    IF target_user_id IS NOT NULL THEN
        INSERT INTO profiles (id, role) VALUES (target_user_id, 'facility_admin')
        ON CONFLICT (id) DO UPDATE SET role = 'facility_admin';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verify Super Admin Function (Helper for RLS)
-- Assumes 'profiles' has the text id.
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = (select auth.uid()::text) 
        AND role = 'super_admin'
    );
EXCEPTION 
    WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Profiles RLS for Super Admin
-- Drop existing policies if they conflict (safely) or create new ones specific to super_admin
DROP POLICY IF EXISTS "Super Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super Admin can update all profiles" ON profiles;

CREATE POLICY "Super Admin can view all profiles"
ON profiles FOR SELECT
TO public
USING ( is_super_admin() );

CREATE POLICY "Super Admin can update all profiles"
ON profiles FOR UPDATE
TO public
USING ( is_super_admin() );

-- 4. Update Memorial Spaces (Facilities) RLS for Super Admin
DROP POLICY IF EXISTS "Super Admin can view all facilities" ON memorial_spaces;
DROP POLICY IF EXISTS "Super Admin can update all facilities" ON memorial_spaces;

CREATE POLICY "Super Admin can view all facilities"
ON memorial_spaces FOR SELECT
TO public
USING ( is_super_admin() );

CREATE POLICY "Super Admin can update all facilities"
ON memorial_spaces FOR UPDATE
TO public
USING ( is_super_admin() );

-- Grant execute permission on the RPC
GRANT EXECUTE ON FUNCTION approve_partner_and_grant_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_partner_and_grant_role(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO anon;
