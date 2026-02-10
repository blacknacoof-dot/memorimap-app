-- [Final Fix] Consolidate RLS policies for facility_reviews to handle Clerk IDs reliably

-- 1. Cleanup: Drop ALL conflicting update/delete policies to start fresh
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users and admins can delete reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users and admins can update reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.facility_reviews; 

-- 2. Insert Policy (Allow authenticated users)
CREATE POLICY "Enable insert for authenticated users"
ON public.facility_reviews
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
);

-- 3. Unified UPDATE Policy (Soft Delete & Edits)
-- Checks both Clerk ID (sub) and Supabase ID (uid) for maximum compatibility
CREATE POLICY "Enable update for users based on user_id"
ON public.facility_reviews
FOR UPDATE
USING (
    -- 1. Owner Check (Clerk ID)
    user_id = (auth.jwt() ->> 'sub') 
    OR 
    -- 2. Owner Check (Legacy/Supabase ID)
    user_id = auth.uid()::text
    OR 
    -- 3. Admin Override
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.clerk_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('super_admin', 'facility_manager', 'sangjo_manager')
    )
    OR
    -- 4. System Override
    user_id = 'system_funeral_migration'
);

-- 4. Unified DELETE Policy (Hard Delete)
CREATE POLICY "Enable delete for users based on user_id"
ON public.facility_reviews
FOR DELETE
USING (
    user_id = (auth.jwt() ->> 'sub') 
    OR 
    user_id = auth.uid()::text
    OR 
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.clerk_id = (auth.jwt() ->> 'sub')
        AND profiles.role IN ('super_admin', 'facility_manager', 'sangjo_manager')
    )
);
