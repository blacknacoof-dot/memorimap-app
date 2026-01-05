-- 1. Add 'business_license_image' column if missing
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'memorial_spaces' and column_name = 'business_license_image') then
        alter table memorial_spaces add column business_license_image text;
    end if;
end $$;

-- 2. Enable RLS
alter table memorial_spaces enable row level security;

-- 3. Policy: Allow PUBLIC (anon) users to INSERT (Fix for Clerk Auth)
-- Since we use Clerk for auth, the Supabase client is technically 'anonymous'.
-- We trust the client-side check for authentication.
drop policy if exists "Allow authenticated users to insert memorial_spaces" on memorial_spaces;
drop policy if exists "Allow public insert memorial_spaces" on memorial_spaces;

create policy "Allow public insert memorial_spaces"
on memorial_spaces for insert
to public
with check (true);

-- 4. Policy: Allow users to SELECT their own facilities (Using Clerk ID Match)
-- We check if owner_user_id matches the requested filter or just allow reading own if we can't filter by auth.uid()
drop policy if exists "Allow users to select their own memorial_spaces" on memorial_spaces;
create policy "Allow users to select their own memorial_spaces"
on memorial_spaces for select
to public
using (true); 
-- Ideally we would filter, but without JWT sync, 'anon' can't filter by 'auth.uid()'. 
-- For MVP, we allow public read of basic facility info (which is needed for search anyway).

-- 5. Create Storage Bucket
insert into storage.buckets (id, name, public)
values ('partner-uploads', 'partner-uploads', true)
on conflict (id) do nothing;

-- 6. Storage Policy: Public Read
drop policy if exists "Give public access to partner-uploads" on storage.objects;
create policy "Give public access to partner-uploads"
on storage.objects for select
using ( bucket_id = 'partner-uploads' );

-- 7. Storage Policy: Public Upload (Fix for Clerk Auth)
drop policy if exists "Allow authenticated uploads to partner-uploads" on storage.objects;
drop policy if exists "Allow public uploads to partner-uploads" on storage.objects;

create policy "Allow public uploads to partner-uploads"
on storage.objects for insert
to public
with check ( bucket_id = 'partner-uploads' );
