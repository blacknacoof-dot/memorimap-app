-- Add column if not exists
alter table memorial_spaces 
add column if not exists business_license_image text;

-- Create storage bucket if not exists (This usually needs to be done via UI or specialized API, 
-- but we can set policies assuming bucket 'partner-docs' or 'biz-licenses' exists. 
-- Let's use 'public-facility-images' or create a new one 'partner-uploads'.)
-- For this script, we assume a public bucket 'partner-uploads' or we use 'facility_images'.
-- Let's stick to 'review-images' style or just 'images'.
-- Ideally, create a new public bucket: 'partner-uploads'

insert into storage.buckets (id, name, public)
values ('partner-uploads', 'partner-uploads', true)
on conflict (id) do nothing;

-- Allow public access to read (so admin can see it)
create policy "Give public access to partner-uploads"
on storage.objects for select
using ( bucket_id = 'partner-uploads' );

-- Allow authenticated uploads
create policy "Allow authenticated uploads to partner-uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'partner-uploads' );
