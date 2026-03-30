BEGIN;

UPDATE storage.buckets
SET public = false
WHERE id = 'partner_docs';

DROP POLICY IF EXISTS "Public Upload partner_docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Select partner_docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload partner_docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Select partner_docs" ON storage.objects;
DROP POLICY IF EXISTS "Super Admin Select partner_docs" ON storage.objects;

CREATE POLICY "Authenticated Upload partner_docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'partner_docs');

CREATE POLICY "Super Admin Select partner_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'partner_docs'
    AND public.is_super_admin()
  );

COMMIT;
