-- ================================================
-- Migration: Prevent profiles.role self-escalation
-- Date: 2026-02-19
-- Issue: C-5 from INTEGRITY_CHECKLIST.md
-- Users can UPDATE their own profiles.role to 'super_admin'
-- ================================================

-- 1. DB Trigger to prevent role column changes by non-super-admins
CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow if role didn't change
    IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
        RETURN NEW;
    END IF;

    -- Only service_role (admin operations) can change role
    -- Regular authenticated users cannot change their own role
    IF current_setting('role', true) != 'service_role' THEN
        RAISE EXCEPTION 'Role changes are not allowed. Contact an administrator.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_prevent_role_escalation ON profiles;

-- Create trigger
CREATE TRIGGER trigger_prevent_role_escalation
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_self_escalation();

-- 2. Additionally, update RLS policy to add WITH CHECK that prevents role changes
-- First check if the policy exists and drop/recreate
DO $$
BEGIN
    -- Drop the permissive modify policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles' AND policyname = 'profiles_modify_own'
    ) THEN
        DROP POLICY profiles_modify_own ON profiles;
    END IF;
END $$;

-- Recreate with role protection in WITH CHECK
CREATE POLICY profiles_modify_own ON profiles
    FOR UPDATE TO authenticated
    USING (clerk_id = auth.jwt() ->> 'sub')
    WITH CHECK (
        clerk_id = auth.jwt() ->> 'sub'
        AND (role IS NOT DISTINCT FROM (SELECT p.role FROM profiles p WHERE p.clerk_id = auth.jwt() ->> 'sub'))
    );

-- Verify
COMMENT ON TRIGGER trigger_prevent_role_escalation ON profiles IS 'Prevents authenticated users from changing their own role. Only service_role can modify roles.';
