# Release RLS Audit Work Log 2026-04-08

## Scope

This note records the release-approval audit performed on 2026-04-08 for the production domain:

- `https://memorimap.kr`

The audit focused on launch readiness, RLS policy safety, and remaining approval gates.

## Confirmed Passing Gates

- Vercel production deployment for `https://memorimap.kr`: `Ready`
- `npm run verify`: passed
- Vitest: 14 files, 51 tests passed
- Release-critical Playwright E2E: 11 tests passed
- Full Playwright E2E rerun with a longer timeout: 76 passed, 3 skipped
- Live `manifest.json`: 200 OK, valid JSON, Korean text rendered correctly
- Live sourcemap request: 404
- Live `ai-test.html`: 404
- RLS enabled check: passed for application tables
  - Only `public.spatial_ref_sys` remained with RLS disabled
  - This is treated as a PostGIS extension-owned exception, not an application table finding

## Confirmed Remaining Non-RLS Issue

The live search metadata still has a production-domain mismatch:

- `robots.txt` points to `https://memorimap.com/sitemap.xml`
- `sitemap.xml` contains `https://memorimap.com/...` URLs
- Production domain under audit is `https://memorimap.kr`

This is not a core runtime failure, but it remains a search exposure and production-domain consistency issue for release approval.

## RLS Policy Condition Review

The initial `pg_policies` output showed several `{public}` policies on sensitive tables. A later query included `qual` and `with_check`, which changed the risk interpretation.

Reviewed sensitive tables:

- `subscription_payments`
- `user_subscriptions`
- `reservations`
- `leads`
- `user_notifications`
- `ai_consultations`
- `partner_conversations`

Observed policy constraints:

- Public `ALL` policies on `subscription_payments`, `user_subscriptions`, `reservations`, and `leads` are constrained by `is_super_admin()`.
- Owner-scoped reads and updates use `clerk_user_id() = user_id`, `auth.jwt() ->> 'sub'`, facility ownership checks, or partner/user ownership checks.
- `payment_intents` is service-role only in the reviewed policy list.
- `system_logs` and rate-limit tables are service-role scoped in the reviewed policy list.

Policy-condition interpretation:

- Broad public access was not confirmed from policy text alone.
- The `{public}` role remains audit-sensitive, but the reviewed conditions mostly restrict access to owner, facility owner, partner/user participant, super admin, or service role.

## Helper Function Anon Evaluation

The following helper evaluation was reported under anon role:

| Function | Result |
| --- | --- |
| `is_super_admin()` | `false` |
| `clerk_user_id()` | `null` |
| `current_user_id()` | `null` |

This result is favorable: anon context does not appear to resolve to a real user or super admin.

## Anon Count Finding

The following `set local role anon` count checks were reported:

| Table | Count |
| --- | ---: |
| `subscription_payments` | 10 |
| `user_subscriptions` | 31 |
| `reservations` | 42 |
| `leads` | 79 |
| `user_notifications` | 40 |
| `ai_consultations` | 34 |
| `partner_conversations` | 0 |

The same anon context with `where is_super_admin()` returned zero for:

- `subscription_payments`
- `reservations`
- `leads`
- `user_subscriptions`

Interpretation:

- The super-admin public `ALL` policies are not the apparent cause of the count results.
- The anon count result is a serious audit signal until reconciled with actual REST anon behavior and row-body access.
- This result may indicate either real anon visibility or a SQL Editor/session-context artifact. It must not be marked safe without follow-up access checks.

## Current Release Decision

RLS activation and automated tests are strong passing signals. However, the anon count result on sensitive tables prevents a full release approval from an RLS audit perspective.

Current decision:

- `Conditional Go`

Reason:

- No confirmed production outage or confirmed REST-level data leak has been established.
- Sensitive-table anon count visibility has been observed and requires row-body and REST anon verification before the RLS audit can be closed.

## Next Verification Targets

Continue with evidence-only checks:

- Confirm whether anon can retrieve row bodies from the sensitive tables, not only counts.
- Confirm whether Supabase REST API anon key behavior matches or differs from the SQL Editor `set local role anon` result.
- Confirm authenticated user A cannot access user B rows for the sensitive tables.
- Confirm skipped Playwright tests are not release-critical RLS coverage.
- Keep the robots/sitemap domain mismatch as a separate release approval issue.
