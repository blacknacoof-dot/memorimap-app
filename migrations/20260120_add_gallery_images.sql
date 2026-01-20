-- Migration: Add gallery_images column to facilities table
-- Date: 2026-01-20
-- Description: Adds a gallery_images column to store multiple images for each facility

-- Add gallery_images column (array of text URLs)
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

-- Add comment
COMMENT ON COLUMN facilities.gallery_images IS 'Array of gallery image URLs for the facility';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_facilities_gallery_images 
ON facilities USING GIN (gallery_images);
