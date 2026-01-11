
-- 1. Ensure facilities table has gallery_images column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facilities' AND column_name = 'gallery_images') THEN
        ALTER TABLE facilities ADD COLUMN gallery_images TEXT[];
    END IF;
END $$;

-- 2. Update Sangjo Gallery Images in 'facilities' table
-- We match by ID if possible, assuming ID match.
-- Or match by type='sangjo' (check if type column exists, usually yes)

UPDATE facilities
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
WHERE category = 'sangjo'; 
-- Using OR to be safe with category naming conventions (sangjo vs other)

-- 3. Also update memorial_spaces just in case (redundancy is fine here)
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
