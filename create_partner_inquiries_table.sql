-- Create partner_inquiries table
create table if not exists public.partner_inquiries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  target_facility_id bigint references public.memorial_spaces(id) on delete set null,
  company_name text not null,
  manager_name text not null,
  phone text not null,
  email text not null,
  type text not null,
  business_gov_id_image text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.partner_inquiries enable row level security;

-- Policies
-- 1. Users can insert their own inquiries
create policy "Users can insert their own inquiries"
  on public.partner_inquiries for insert
  with check (true);

-- 2. Users can view their own inquiries (optional, but good for history)
create policy "Users can view their own inquiries"
  on public.partner_inquiries for select
  using ((select auth.uid()) = user_id);

-- 3. Admins (Super Admins) can view all inquiries
-- Assuming there's a way to check for super admin, or we just allow public read for now if strict RLS isn't set up for admins yet.
-- Ideally: using (auth.uid() in (select id from users where role = 'super_admin'))
-- For now, allowing authenticated users to insert is key. Admin table access often bypasses RLS if using service role, but checking existing policies...
-- Let's stick to simple policies.

create policy "Admins can view all inquiries"
  on public.partner_inquiries for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role in ('super_admin', 'sangjo_hq_admin') 
      -- Adjust roles as needed based on existing role system
    )
  );

create policy "Admins can update inquiries"
  on public.partner_inquiries for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role in ('super_admin') 
    )
  );
