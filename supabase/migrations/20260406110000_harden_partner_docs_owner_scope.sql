BEGIN;

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

COMMIT;
