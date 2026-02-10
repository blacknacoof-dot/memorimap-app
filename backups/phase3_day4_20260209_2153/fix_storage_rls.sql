-- Drop strict policies if they exist
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create permissive policy for development (Allow Anon/Public Uploads)
-- This is necessary because the Supabase client is not receiving the Clerk user session,
-- so all requests appear as 'anon'.
CREATE POLICY "Allow Anon Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'facility-images' );

-- Ensure Public Select access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'facility-images' );

-- Allow Update/Delete for anyone (optional, purely for dev convenience if needed)
-- CREATE POLICY "Allow Anon Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'facility-images' );
-- CREATE POLICY "Allow Anon Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'facility-images' );
