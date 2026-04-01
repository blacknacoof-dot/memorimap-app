# Security Advisor RLS Remediation 2026-04-01

## Summary

- Supabase Security Advisor reported `rls_disabled_in_public` on `public.shared_journey_rate_limits`.
- Live remediation was applied in Supabase SQL Editor on April 1, 2026.
- Repository remediation was recorded in [20260401_fix_shared_journey_rate_limits_rls.sql](/C:/Users/black/Desktop/memorimap/supabase/migrations/20260401_fix_shared_journey_rate_limits_rls.sql).

## Actions Taken

- Enabled RLS on `public.shared_journey_rate_limits`.
- Added `service_role` policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- Verified that `public.shared_journey_rate_limits` no longer appears in the `rowsecurity = false` check.

## Remaining Advisor Item

- `public.spatial_ref_sys` still appears in Advisor.
- This table is PostGIS extension-owned and rejected direct alteration with `ERROR: 42501: must be owner of table spatial_ref_sys`.
- Treat this as a platform or extension ownership issue rather than an application-table exposure.

## Verification Query

```sql
select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity = false
order by tablename;
```

Expected result after application-table remediation:

```text
public | spatial_ref_sys
```
