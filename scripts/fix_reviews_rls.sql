
-- Enable RLS on reviews table (if not already)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing read policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Public reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;

-- Create a policy that allows everyone (anon and authenticated) to SELECT reviews
CREATE POLICY "Public reviews are viewable by everyone"
ON reviews FOR SELECT
USING (true);

-- Allow authenticated users to INSERT reviews
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Allow authenticated users to UPDATE their own reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
USING (auth.uid()::text = user_id);

-- Allow authenticated users to DELETE their own reviews
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
CREATE POLICY "Users can delete their own reviews"
ON reviews FOR DELETE
USING (auth.uid()::text = user_id);
