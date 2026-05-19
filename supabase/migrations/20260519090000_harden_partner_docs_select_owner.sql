BEGIN;

DROP POLICY IF EXISTS "Owner Select partner_docs" ON storage.objects;

CREATE POLICY "Owner Select partner_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'partner_docs'
    AND (storage.foldername(name))[1] = 'licenses'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

COMMIT;
