-- Add operating_hours column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memorial_spaces' AND column_name = 'operating_hours') THEN
        ALTER TABLE memorial_spaces ADD COLUMN operating_hours TEXT;
    END IF;
END $$;

-- Check if gallery_images exists, if not add it (it should exist based on usage, but safety check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memorial_spaces' AND column_name = 'gallery_images') THEN
        ALTER TABLE memorial_spaces ADD COLUMN gallery_images TEXT[];
    END IF;
END $$;
