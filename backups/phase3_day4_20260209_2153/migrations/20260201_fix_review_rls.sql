-- [Fix] Update RLS policies for facility_reviews to handle Clerk IDs (TEXT) correctly

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.facility_reviews;

-- 2. Re-create DELETE policy with explicit text casting
-- Clerk uses TEXT IDs, so we must cast auth.uid() to text
CREATE POLICY "Users can delete their own reviews"
ON public.facility_reviews
FOR DELETE
USING (
    user_id = auth.uid()::text
);

-- 3. Re-create UPDATE policy (for Soft Delete: is_active = false)
CREATE POLICY "Users can update their own reviews"
ON public.facility_reviews
FOR UPDATE
USING (
    user_id = auth.uid()::text
)
WITH CHECK (
    user_id = auth.uid()::text
);

-- 4. Ensure SELECT is open (for viewing reviews)
-- Already likely exists, but verifying
DROP POLICY IF EXISTS "Public can view active reviews" ON public.facility_reviews;
CREATE POLICY "Public can view active reviews"
ON public.facility_reviews
FOR SELECT
USING (true);
