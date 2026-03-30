BEGIN;

-- Review images are user-generated uploads and should not remain directly public.
-- Production uses the review-images bucket and the app now resolves them through signed URLs.
UPDATE storage.buckets
SET public = false
WHERE id = 'review-images';

DROP POLICY IF EXISTS "Public Select review-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Select review-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Select reviews" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Select reviews" ON storage.objects;

-- Signed URL issuance now requires an authenticated session.
-- Direct public object URLs stop working after this migration.
CREATE POLICY "Authenticated Select review-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'review-images');

-- Facility marketing images remain public assets by product decision.
UPDATE storage.buckets
SET public = true
WHERE id = 'facility-images';

COMMIT;
