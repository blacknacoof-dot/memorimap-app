BEGIN;

DROP POLICY IF EXISTS "Authenticated Upload reviews" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload review-images" ON storage.objects;

CREATE POLICY "Authenticated Upload review-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'review-images'
    AND lower(name) ~ '^review-images/[a-z0-9-]+/[0-9]{13}_[a-f0-9]{8}_[a-z0-9-]+\.(jpg|jpeg|png|webp)$'
  );

COMMIT;
