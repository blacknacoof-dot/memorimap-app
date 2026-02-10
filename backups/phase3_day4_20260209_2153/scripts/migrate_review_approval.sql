
-- Add status column to reviews table
-- Default is 'pending' for new reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Update existing reviews to be 'approved' so they remain visible
UPDATE reviews 
SET status = 'approved' 
WHERE status IS NULL OR status = 'pending';

-- Verify update
-- SELECT id, user_name, status FROM reviews LIMIT 5;
