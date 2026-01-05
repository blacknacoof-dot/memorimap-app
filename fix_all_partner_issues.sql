-- 1. Add 'business_license_image' column to memorial_spaces if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'memorial_spaces' and column_name = 'business_license_image') then
        alter table memorial_spaces add column business_license_image text;
    end if;
end $$;

-- 2. Enable RLS on memorial_spaces (if not already enabled)
alter table memorial_spaces enable row level security;

-- 3. Policy: Allow authenticated users to INSERT (Apply for partner)
drop policy if exists "Allow authenticated users to insert memorial_spaces" on memorial_spaces;
create policy "Allow authenticated users to insert memorial_spaces"
on memorial_spaces for insert
to authenticated
with check (true);

-- 4. Policy: Allow users to SELECT their own facilities
drop policy if exists "Allow users to select their own memorial_spaces" on memorial_spaces;
create policy "Allow users to select their own memorial_spaces"
on memorial_spaces for select
to authenticated
using (owner_user_id = auth.uid()::text); 
-- Note: If you use a different ID format (like Clerk ID string), ensure this matches. 
-- If owner_user_id stores the Clerk ID (e.g., 'user_2...'), and auth.uid() is the Supabase UUID, this logic might need adjustment.
-- Assuming standard Supabase Auth for now. If using custom auth updates:
-- using (owner_user_id = auth.uid()::text OR owner_user_id = current_setting('request.jwt.claim.sub', true));

-- 5. Create 'partner-uploads' Storage Bucket
insert into storage.buckets (id, name, public)
values ('partner-uploads', 'partner-uploads', true)
on conflict (id) do nothing;

-- 6. Storage Policy: Public Read
drop policy if exists "Give public access to partner-uploads" on storage.objects;
create policy "Give public access to partner-uploads"
on storage.objects for select
using ( bucket_id = 'partner-uploads' );

-- 7. Storage Policy: Authenticated Upload
drop policy if exists "Allow authenticated uploads to partner-uploads" on storage.objects;
create policy "Allow authenticated uploads to partner-uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'partner-uploads' );
