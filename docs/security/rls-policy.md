# Supabase RLS Policy Runbook

Last updated: 2026-04-08

## 1. Purpose

This document is the operating runbook for Supabase `rls_disabled_in_public` warnings.

Supabase exposes tables in configured API schemas, and this project treats `public` as an exposed schema. Any application table in `public` must have Row Level Security (RLS) enabled. RLS is table-scoped, not project-scoped, so every new or recreated table must be checked individually.

Security Advisor warning handled here:

- `Critical issue`
- `Table publicly accessible`
- `rls_disabled_in_public`

Official baseline:

- Supabase Data APIs are designed to work with Postgres RLS.
- Tables in exposed schemas such as `public` must have RLS enabled.
- Dashboard-created tables may enable RLS by default, but SQL-created tables require explicit RLS.
- `service_role` is server-only and bypasses RLS.

References:

- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/database/postgres/row-level-security

## 2. Operating Principles

- All application tables in `public` must have RLS enabled.
- RLS without policies is safer than RLS off. It blocks client access until an explicit policy is added.
- Public read access must be deliberate and documented.
- `anon` policies are allowed only for intentionally public data, such as public facility search data or public notices.
- `authenticated` policies must be scoped by ownership, facility, organization, admin role, or another explicit business rule.
- Avoid `USING (true)` or `WITH CHECK (true)` for `authenticated` except for tables that are intentionally readable or writable by every signed-in user.
- `service_role` must be used only from trusted server code, Supabase Edge Functions, cron jobs, or admin tooling.
- Never expose `service_role` to browsers, Vite client env, mobile clients, logs, or user-visible error messages.
- Internal-only tables should be created outside `public` when possible, for example in `private`, `internal`, or another non-exposed schema.
- Backup, import, staging, and temporary tables must not remain in `public`.
- `DROP TABLE` plus recreation removes the table's RLS settings and policies. The replacement table must re-enable RLS and recreate policies.

## 3. Immediate Warning Resolution SQL

Run this section in Supabase SQL Editor before changing anything. The first five queries are inspection or SQL generation only.

### 3.1 RLS disabled table query

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls,
  case
    when c.relname = 'spatial_ref_sys' then 'extension-owned candidate: review separately'
    else 'application table: enable RLS'
  end as recommended_action
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = false
order by c.relname;
```

Expected application-table result after remediation: zero rows. If only `spatial_ref_sys` remains, compare with the 2026-04-01 security report before treating it as an application defect.

### 3.2 All public schema tables

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  case c.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned_table'
    when 'v' then 'view'
    when 'm' then 'materialized_view'
    else c.relkind::text
  end as object_type,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls,
  obj_description(c.oid) as comment
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm')
order by object_type, table_name;
```

### 3.3 anon access risk query

```sql
with anon_grants as (
  select table_schema, table_name, string_agg(privilege_type, ', ' order by privilege_type) as privileges
  from information_schema.table_privileges
  where table_schema = 'public'
    and grantee = 'anon'
  group by table_schema, table_name
),
anon_policies as (
  select
    schemaname,
    tablename,
    string_agg(policyname || ' [' || cmd || '] roles=' || array_to_string(roles, ','), '; ' order by policyname) as policies
  from pg_policies
  where schemaname = 'public'
    and ('anon' = any(roles) or 'public' = any(roles))
  group by schemaname, tablename
)
select
  t.table_schema,
  t.table_name,
  coalesce(g.privileges, '-') as anon_grants,
  coalesce(p.policies, '-') as anon_or_public_policies,
  case
    when g.privileges is not null and p.policies is null then 'grant exists without explicit anon policy: review'
    when p.policies is not null then 'anon/public policy exists: verify it is intentional'
    else 'no anon exposure detected'
  end as review_note
from information_schema.tables t
left join anon_grants g
  on g.table_schema = t.table_schema
 and g.table_name = t.table_name
left join anon_policies p
  on p.schemaname = t.table_schema
 and p.tablename = t.table_name
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  and (g.privileges is not null or p.policies is not null)
order by t.table_name;
```

### 3.4 RLS-enabled tables without policies

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.policyname) as policy_count,
  case
    when count(p.policyname) = 0 then 'RLS enabled but no policies: clients are blocked; add policy only if client access is intended'
    else 'has policies'
  end as review_note
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname
 and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = true
group by n.nspname, c.relname, c.relrowsecurity
having count(p.policyname) = 0
order by c.relname;
```

### 3.5 Generate RLS enable SQL

This query generates the exact `ALTER TABLE` statements for current `public` tables with RLS disabled. Review generated statements before running them.

```sql
select
  format(
    'alter table %I.%I enable row level security;',
    n.nspname,
    c.relname
  ) as enable_rls_sql
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = false
  and c.relname <> 'spatial_ref_sys'
order by c.relname;
```

### 3.6 Apply RLS to all application tables currently off

Use only after reviewing the generated SQL above. This does not delete data. It may block client access for a table until the required policies exist.

```sql
do $$
declare
  target_table record;
begin
  for target_table in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity = false
      and c.relname <> 'spatial_ref_sys'
  loop
    execute format(
      'alter table %I.%I enable row level security',
      target_table.schema_name,
      target_table.table_name
    );
  end loop;
end $$;
```

### 3.7 Generate table-by-table remediation plan

This query produces a table list, the immediate RLS SQL, and the safest default policy decision. The safest default is to enable RLS and add no client policy until the access model is confirmed.

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  format('alter table %I.%I enable row level security;', n.nspname, c.relname) as enable_rls_sql,
  case
    when c.relname in ('spatial_ref_sys') then 'extension-owned: review separately'
    when c.relname like '%log%' or c.relname like '%audit%' or c.relname like '%rate_limit%' then 'server/internal candidate: prefer no client policy or service_role-only policy'
    when c.relname like '%payment%' or c.relname like '%subscription%' then 'sensitive billing table: no anon policy; use service_role or strict owner/admin policy only'
    when c.relname in ('facilities', 'platform_notices') then 'public-read candidate: allow anon select only if row is intentionally public'
    else 'default: enable RLS, add no policy until owner/facility/admin scope is confirmed'
  end as minimum_policy_recommendation
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = false
order by c.relname;
```

## 4. Project RLS Check SQL Set

Run these queries before every DB deployment and whenever Security Advisor reports a new warning.

### A. RLS OFF tables

```sql
select n.nspname as schema_name, c.relname as table_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = false
order by c.relname;
```

### B. Tables without policies

```sql
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname
 and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
group by n.nspname, c.relname, c.relrowsecurity
having count(p.policyname) = 0
order by c.relrowsecurity, c.relname;
```

### C. anon access allowed tables

```sql
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and ('anon' = any(roles) or 'public' = any(roles))
order by tablename, policyname;
```

### D. authenticated broad-access policies

```sql
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check,
  case
    when lower(coalesce(nullif(trim(qual), ''), '__not_true__')) in ('true', '(true)')
      or lower(coalesce(nullif(trim(with_check), ''), '__not_true__')) in ('true', '(true)')
      or cmd = 'ALL'
    then 'review broad true condition'
    else 'scoped condition present'
  end as review_note
from pg_policies
where schemaname = 'public'
  and ('authenticated' = any(roles) or 'public' = any(roles))
  and (
    lower(coalesce(qual, '')) in ('true', '(true)')
    or lower(coalesce(with_check, '')) in ('true', '(true)')
    or cmd = 'ALL'
  )
order by tablename, policyname;
```

### E. service_role-only public tables to review

`service_role` bypasses RLS by design. This query finds public tables whose policies are only for server-side access. These tables may be candidates for a non-public schema if clients never need them.

```sql
with policy_roles as (
  select
    schemaname,
    tablename,
    bool_or('service_role' = any(roles)) as has_service_role_policy,
    bool_or('anon' = any(roles) or 'authenticated' = any(roles) or 'public' = any(roles)) as has_client_policy
  from pg_policies
  where schemaname = 'public'
  group by schemaname, tablename
)
select
  t.table_schema,
  t.table_name,
  coalesce(pr.has_service_role_policy, false) as has_service_role_policy,
  coalesce(pr.has_client_policy, false) as has_client_policy,
  case
    when coalesce(pr.has_service_role_policy, false) = true
     and coalesce(pr.has_client_policy, false) = false
    then 'server-only table in public: consider moving to private/internal schema'
    else 'review grants and policies'
  end as review_note
from information_schema.tables t
left join policy_roles pr
  on pr.schemaname = t.table_schema
 and pr.tablename = t.table_name
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  and coalesce(pr.has_service_role_policy, false) = true
order by t.table_name;
```

### F. Full public schema security status

```sql
with policy_counts as (
  select schemaname, tablename, count(*) as policy_count
  from pg_policies
  where schemaname = 'public'
  group by schemaname, tablename
),
anon_policy_counts as (
  select schemaname, tablename, count(*) as anon_policy_count
  from pg_policies
  where schemaname = 'public'
    and ('anon' = any(roles) or 'public' = any(roles))
  group by schemaname, tablename
),
auth_policy_counts as (
  select schemaname, tablename, count(*) as authenticated_policy_count
  from pg_policies
  where schemaname = 'public'
    and ('authenticated' = any(roles) or 'public' = any(roles))
  group by schemaname, tablename
),
grant_summary as (
  select
    table_schema,
    table_name,
    string_agg(grantee || ':' || privilege_type, ', ' order by grantee, privilege_type) as grants
  from information_schema.table_privileges
  where table_schema = 'public'
    and grantee in ('anon', 'authenticated', 'service_role')
  group by table_schema, table_name
)
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  coalesce(pc.policy_count, 0) as policy_count,
  coalesce(apc.anon_policy_count, 0) as anon_policy_count,
  coalesce(aupc.authenticated_policy_count, 0) as authenticated_policy_count,
  coalesce(gs.grants, '-') as api_role_grants,
  case
    when c.relrowsecurity = false and c.relname <> 'spatial_ref_sys' then 'FAIL: RLS disabled on application table'
    when c.relrowsecurity = false and c.relname = 'spatial_ref_sys' then 'REVIEW: extension-owned PostGIS table'
    when c.relrowsecurity = true and coalesce(pc.policy_count, 0) = 0 then 'PASS_LOCKED: RLS on, no client policies'
    when coalesce(apc.anon_policy_count, 0) > 0 then 'REVIEW: anon/public policy exists'
    else 'PASS_REVIEWED'
  end as status
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join policy_counts pc
  on pc.schemaname = n.nspname
 and pc.tablename = c.relname
left join anon_policy_counts apc
  on apc.schemaname = n.nspname
 and apc.tablename = c.relname
left join auth_policy_counts aupc
  on aupc.schemaname = n.nspname
 and aupc.tablename = c.relname
left join grant_summary gs
  on gs.table_schema = n.nspname
 and gs.table_name = c.relname
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by status, table_name;
```

## 5. Minimal Policy Templates

These are templates, not automatic fixes. Replace table and column names with the real ownership model.

### Owner-scoped user table

```sql
alter table public.example_user_table enable row level security;

create policy "example_user_table_select_own"
on public.example_user_table
for select
to authenticated
using (user_id = auth.uid());

create policy "example_user_table_insert_own"
on public.example_user_table
for insert
to authenticated
with check (user_id = auth.uid());

create policy "example_user_table_update_own"
on public.example_user_table
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

### Clerk user id scoped table

Use this project pattern when the row stores a Clerk id rather than Supabase Auth UUID.

```sql
alter table public.example_clerk_table enable row level security;

create policy "example_clerk_table_select_own"
on public.example_clerk_table
for select
to authenticated
using (clerk_user_id = public.clerk_user_id());
```

### Server-only table

If the table must stay in `public`, lock it to server paths. Prefer a non-public schema when possible.

```sql
alter table public.example_server_only_table enable row level security;

create policy "example_server_only_table_service_all"
on public.example_server_only_table
for all
to service_role
using (true)
with check (true);
```

### Public read-only table

Use only for deliberately public data.

```sql
alter table public.example_public_read_table enable row level security;

create policy "example_public_read_table_select_public"
on public.example_public_read_table
for select
to anon, authenticated
using (is_public = true);
```

## 6. Migration Checklist

Every migration that creates or recreates a table must include this checklist in review:

- [ ] Does the migration create `public.*` tables?
- [ ] Does each new `public.*` table include `alter table ... enable row level security`?
- [ ] Are policies present only where client access is required?
- [ ] Are `authenticated` policies scoped by owner, facility, organization, admin role, or explicit business state?
- [ ] Are `anon` policies limited to intentionally public read-only data or intentionally public inserts?
- [ ] Are server-only tables outside `public` where possible?
- [ ] Did the migration use `drop table`, `create table as`, `select into`, or backup/import tables?
- [ ] Did the migration avoid leaving temporary or backup tables in `public`?
- [ ] Did the reviewer run the Project RLS Check SQL Set?
- [ ] Was the Security Advisor result recorded below?

## 7. Deployment Checklist

- [ ] Run query A: RLS OFF tables.
- [ ] Run query B: tables without policies.
- [ ] Run query C: anon access allowed tables.
- [ ] Run query D: authenticated broad-access policies.
- [ ] Run query E: service_role-only public tables.
- [ ] Run query F: full public schema security status.
- [ ] Confirm there are no `FAIL: RLS disabled on application table` rows.
- [ ] Confirm any `spatial_ref_sys` warning is treated separately as an extension-owned table.
- [ ] Confirm Security Advisor has no new application-table `rls_disabled_in_public` warning.
- [ ] Record the result in the change log below.

## 8. Warning Response Procedure

When Security Advisor reports `rls_disabled_in_public`:

1. Run query A to identify exact tables.
2. Separate extension-owned objects from application tables.
3. For application tables, run query 3.5 to generate `alter table ... enable row level security`.
4. Check query B to see whether enabling RLS will lock clients out due to missing policies.
5. Add minimal policies using the templates above only where client access is required.
6. Run query F and confirm there are no application-table failures.
7. Record the table names, SQL run, policy decision, and verification result in this document.

## 9. Risk Patterns

- Creating a table in SQL Editor without RLS.
- Creating a table in a migration without RLS.
- Recreating a table with `drop table` and forgetting to recreate RLS and policies.
- Creating backup or import tables in `public`.
- Treating `authenticated` as safe without ownership filtering.
- Adding `to public using (true)` to unblock a frontend error.
- Granting `anon` write access for convenience.
- Testing only with `service_role`, which bypasses RLS and can hide broken client policies.
- Keeping Edge Function-only tables in `public` without documenting why they cannot be in a private schema.

## 10. Work Log

Keep this section current. Add a row whenever a migration adds a table, a Security Advisor warning appears, or a release check is completed.

| Date | Change | Tables | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-04-01 | Security Advisor remediation | `public.shared_journey_rate_limits` | PASS | RLS enabled and service_role policies added. `public.spatial_ref_sys` remained as extension-owned review item. |
| 2026-04-08 | RLS runbook created | all `public` tables | DOCS | Added SQL check set, immediate remediation generator, operating rules, and release checklist. |
| 2026-04-08 | RLS exception accepted | `public.spatial_ref_sys` | PASS | PostGIS extension-owned system table. No application data exposure. Review on next Security Advisor warning. |

## 11. RLS Exception Record

Date: 2026-04-08

Table:
`public.spatial_ref_sys`

Reason:
PostGIS extension-owned system table

Risk:
No application data exposure

Action:
Exception accepted

Status:
Security PASS

Next Review:
On next Security Advisor warning

Regular check SQL:

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = false
order by c.relname;
```

Expected normal result:

```text
public | spatial_ref_sys | false
```

Treat only these cases as security issues:

- A table other than `spatial_ref_sys` appears in the RLS OFF result.
- A new `public` table is created.
- The warning reappears after a migration and the RLS OFF result contains an application table.

Reusable GPT check prompt:

```text
Supabase RLS Security Advisor 점검을 수행하세요.

[현재 예외]

extension-owned exception:
public.spatial_ref_sys

[요청]

public schema RLS OFF 테이블 확인
spatial_ref_sys 외 테이블 존재 여부 확인
존재 시 보안 이슈 판단
없으면 PASS 판단

[판정 기준]

PASS 조건:

spatial_ref_sys만 존재

FAIL 조건:

spatial_ref_sys 외 application table 존재

[출력 형식]

현재 RLS 상태
예외 테이블
보안 위험 여부
PASS / FAIL 판정
추가 조치
최종 결론
```

Current project status:

```text
Payment system: PASS
Webhook: PASS
RLS security: PASS
Overall project security status: PASS
```

## 12. Auto-Maintenance Rules

These rules are mandatory for future DB work:

- New table rule: if a migration adds `create table public.*`, update this document in the same change.
- Migration rule: every migration that changes table access must record which RLS check queries were run.
- Security Advisor rule: every new warning must be recorded in the Work Log with table name, root cause, action, and verification result.
- Release rule: before release, run the Deployment Checklist and record the date and result.
- Exception rule: every accepted exception, such as extension-owned objects, must include owner, reason, and next review date.
- Server-only rule: if a table has only `service_role` policies, record why it remains in `public` or plan migration to a non-public schema.

## 13. Final Recommended Structure

- Client-readable data: `public` table, RLS enabled, narrow `anon` or `authenticated` policies.
- User-owned data: `public` table, RLS enabled, owner-scoped policies.
- Admin-owned data: `public` table, RLS enabled, admin-role policies via trusted helper functions.
- Edge Function-only data: prefer non-public schema; if kept in `public`, RLS enabled and `service_role` policies only.
- Logs, rate limits, payment intents, audit internals: prefer non-public schema for future tables; existing `public` tables must stay RLS enabled.
- Backup/import/staging data: never leave in `public` after the operation.
