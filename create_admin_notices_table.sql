-- Create admin_notices table
create table if not exists public.admin_notices (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  category text default 'general', -- 'general', 'maintenance', 'policy'
  is_urgent boolean default false,
  author_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.admin_notices enable row level security;

-- Policies
create policy "Admins can insert notices"
  on public.admin_notices for insert
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'super_admin'
    )
  );

create policy "Admins can update/delete notices"
  on public.admin_notices for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'super_admin'
    )
  );

create policy "Everyone can view notices"
  on public.admin_notices for select
  using (true);
