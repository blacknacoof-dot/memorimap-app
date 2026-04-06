BEGIN;

-- Release decision: partner application is an authenticated flow.
-- Keep partner_docs private and only allow structured uploads under licenses/<user-id>/...
DROP POLICY IF EXISTS "Authenticated Upload partner_docs" ON storage.objects;
CREATE POLICY "Authenticated Upload partner_docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'partner_docs'
    AND (storage.foldername(name))[1] = 'licenses'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND lower(name) ~ '^licenses/[a-z0-9-]+/[0-9]{13}_[a-f0-9]{8}_[a-z0-9-]+\.(pdf|jpg|jpeg|png|webp)$'
  );

-- Facility images are image-only uploads with a single facility folder prefix.
DROP POLICY IF EXISTS "Authenticated Upload facility-images" ON storage.objects;
CREATE POLICY "Authenticated Upload facility-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'facility-images'
    AND lower(name) ~ '^[a-z0-9-]+/[0-9]{13}_[a-f0-9]{8}_[a-z0-9-]+\.(jpg|jpeg|png|webp)$'
  );

-- Review uploads already require authenticated users; restrict them to image formats as well.
DROP POLICY IF EXISTS "Authenticated Upload reviews" ON storage.objects;
CREATE POLICY "Authenticated Upload reviews"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reviews'
    AND lower(name) ~ '^review-images/[a-z0-9-]+/[0-9]{13}_[a-f0-9]{8}_[a-z0-9-]+\.(jpg|jpeg|png|webp)$'
  );

COMMIT;
