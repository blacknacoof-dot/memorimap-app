
DO $$
DECLARE
    r RECORD;
    gallery_pool TEXT[] := ARRAY[
        '/sangjo-gallery/sangjo_1.jpg',
        '/sangjo-gallery/sangjo_2.jpg',
        '/sangjo-gallery/sangjo_3.jpg',
        '/sangjo-gallery/sangjo_4.jpg',
        '/sangjo-gallery/sangjo_5.jpg',
        '/sangjo-gallery/sangjo_6.jpg',
        '/sangjo-gallery/sangjo_7.jpg'
    ];
    new_images TEXT[];
BEGIN
    -- Loop through each Sangjo facility in memorial_spaces
    FOR r IN SELECT id FROM memorial_spaces WHERE type = 'sangjo'
    LOOP
        -- Generate a random selection of 3 images for THIS specific row
        SELECT array_agg(img) INTO new_images
        FROM (
            SELECT img 
            FROM unnest(gallery_pool) AS img 
            ORDER BY random() 
            LIMIT 3
        ) AS sub;

        -- Update the specific row
        UPDATE memorial_spaces
        SET gallery_images = new_images
        WHERE id = r.id;
        
        -- RAISE NOTICE 'Updated % with %', r.id, new_images;
    END LOOP;
END $$;
