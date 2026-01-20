-- Migration: Add gallery_images column to funeral_companies table
-- Date: 2026-01-20
-- Description: Adds a gallery_images column to store multiple images for each funeral company (상조서비스)

-- Add gallery_images column (array of text URLs)
ALTER TABLE funeral_companies
ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

-- Add comment
COMMENT ON COLUMN funeral_companies.gallery_images IS 'Array of gallery image URLs for the funeral company';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_funeral_companies_gallery_images 
ON funeral_companies USING GIN (gallery_images);
