
-- Migration: Create system_logs table for server-side logging
-- Description: Stores logs from Edge Functions and Client (TraceID)

create table if not exists public.system_logs (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    level text not null check (level in ('INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL')),
    message text not null,
    trace_id text,
    meta jsonb default '{}'::jsonb,
    source text not null, -- e.g., 'edge-function:approve-partner', 'client:ChatInterface'
    constraint system_logs_pkey primary key (id)
);

-- Enable RLS
alter table public.system_logs enable row level security;

-- Policy: Service Role can do everything (Read/Write/Delete)
create policy "Service Role can manage all logs"
    on public.system_logs
    for all
    to service_role
    using (true)
    with check (true);

-- Policy: Authenticated users can INSERT logs (for client-side tracing)
-- They cannot read or delete logs, only append.
create policy "Authenticated users can insert logs"
    on public.system_logs
    for insert
    to authenticated
    with check (true);

-- Policy: Authenticated users (Admins) can view logs?
-- For now, we restrict viewing to Dashboard (Super Admin) or Service Role.
-- If Super Admin needs to see logs in app, we can add a policy later.
-- Currently, we assume logs are viewed via Supabase Dashboard.

-- Grant access
grant insert on public.system_logs to authenticated;
grant all on public.system_logs to service_role;

comment on table public.system_logs is 'Centralized logging table for server and client side events with TraceID';
