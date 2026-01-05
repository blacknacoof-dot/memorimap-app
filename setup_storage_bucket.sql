-- Create the 'licenses' storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('licenses', 'licenses', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'licenses' );

-- Policy: Allow public to view files (required for getPublicUrl)
CREATE POLICY "Allow public view"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'licenses' );
