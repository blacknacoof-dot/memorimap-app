BEGIN;

UPDATE storage.buckets
SET public = false
WHERE id IN ('review-images', 'partner_docs');

DROP POLICY IF EXISTS "Public Select review-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Select reviews" ON storage.objects;
DROP POLICY IF EXISTS "Public Select partner_docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload partner_docs" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated Select review-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload review-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload reviews" ON storage.objects;

CREATE POLICY "Authenticated Select review-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated Upload review-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'review-images'
    AND lower(name) ~ '^review-images/[a-z0-9-]+/[0-9]{13}_[a-f0-9]{8}_[a-z0-9-]+\.(jpg|jpeg|png|webp)$'
  );

DROP POLICY IF EXISTS "Authenticated Upload partner_docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Select partner_docs" ON storage.objects;
DROP POLICY IF EXISTS "Super Admin Select partner_docs" ON storage.objects;

CREATE POLICY "Authenticated Upload partner_docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'partner_docs'
    AND (storage.foldername(name))[1] = 'licenses'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND lower(name) ~ '^licenses/[a-z0-9-]+/[0-9]{13}_[a-f0-9]{8}_[a-z0-9-]+\.(pdf|jpg|jpeg|png|webp)$'
  );

CREATE POLICY "Super Admin Select partner_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'partner_docs'
    AND public.is_super_admin()
  );

UPDATE storage.buckets
SET public = true
WHERE id = 'facility-images';

COMMIT;
