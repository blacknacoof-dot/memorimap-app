
-- 1. Fix Schema: Ensure 'owner_user_id' exists (as TEXT for Clerk ID incompatibility)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memorial_spaces' AND column_name = 'owner_user_id') THEN
        ALTER TABLE memorial_spaces ADD COLUMN owner_user_id TEXT;
    END IF;
    -- Just in case there is a 'user_id' column causing confusion, we leave it be or check it.
    -- The error "column user_id does not exist" usually means a Policy references it but it's not there.
END $$;

-- 2. Clean up any Broken Policies referencing 'user_id'
-- We drop potential misnamed policies to be safe.
DROP POLICY IF EXISTS "Users can update own facility" ON memorial_spaces;
DROP POLICY IF EXISTS "Owners can update own facility" ON memorial_spaces;
DROP POLICY IF EXISTS "Allow users to select their own memorial_spaces" ON memorial_spaces;

-- 3. Re-Apply Correct RLS Policies (using owner_user_id)
ALTER TABLE memorial_spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view facilities" ON memorial_spaces;
CREATE POLICY "Public can view facilities"
  ON memorial_spaces FOR SELECT
  USING (true);

CREATE POLICY "Owners can update own facility"
  ON memorial_spaces FOR UPDATE
  USING (owner_user_id = auth.uid()::text); 
  -- Note: If auth.uid() is UUID and owner_user_id is TEXT, casting is needed.
  -- If using Clerk, auth.uid() might be the Clerk ID string (if custom auth is set) or Supabase UUID.

-- 4. Update Sangjo Gallery Images (The Main Request)
-- We distribute 3 random images to EACH Sangjo facility.
-- Since we can't easily loop in SQL for "different random per row" without a function,
-- we will use a correlated subquery approach.

UPDATE memorial_spaces
SET gallery_images = (
  SELECT array_agg(img) 
  FROM (
    SELECT img 
    FROM unnest(ARRAY[
      '/sangjo-gallery/sangjo_1.jpg',
      '/sangjo-gallery/sangjo_2.jpg',
      '/sangjo-gallery/sangjo_3.jpg',
      '/sangjo-gallery/sangjo_4.jpg',
      '/sangjo-gallery/sangjo_5.jpg',
      '/sangjo-gallery/sangjo_6.jpg',
      '/sangjo-gallery/sangjo_7.jpg'
    ]) AS img 
    ORDER BY random() 
    LIMIT 3
  ) AS random_images
)
WHERE type = 'sangjo';

-- Verification
SELECT id, name, gallery_images FROM memorial_spaces WHERE type = 'sangjo' LIMIT 5;
