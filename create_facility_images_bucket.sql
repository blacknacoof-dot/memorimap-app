-- Create 'facility-images' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('facility-images', 'facility-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'facility-images' );

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'facility-images' AND auth.role() = 'authenticated' );

-- Policy: Allow authenticated users to update/delete their own images
-- (Optional, for now just Upload/Select is critical)
