-- Enable RLS on memorial_spaces if not already enabled
alter table memorial_spaces enable row level security;

-- Allow authenticated users to INSERT into memorial_spaces (for partner applications)
-- This policy allows any authenticated user to create a facility record.
-- The record is created with is_verified = false by default in the application logic.
create policy "Allow authenticated users to insert memorial_spaces"
on memorial_spaces for insert
to authenticated
with check (true);

-- Allow public (anon) to INSERT if you want to support non-logged in applications (optional, but code handles logged in mostly)
-- create policy "Allow anon users to insert memorial_spaces"
-- on memorial_spaces for insert
-- to anon
-- with check (true);

-- Ensure users can see the facilities they created (for 'My Facility' features)
create policy "Allow users to select their own memorial_spaces"
on memorial_spaces for select
to authenticated
using (owner_user_id = auth.uid()::text OR owner_user_id = current_setting('request.jwt.claim.sub', true));
-- Note: Adjust owner_user_id check depending on whether you store UUID or Clerk ID string. 
-- If storing Clerk ID, you might need to match against the token's sub claim if using custom auth, 
-- or just allow public select since facilities are generally public.

-- Existing public select policy usually exists:
-- create policy "Allow public select" on memorial_spaces for select using (true);
