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

## REST Anon Verification

After the count finding, the same sensitive tables were checked through the live Supabase REST API using the anon key and no user session. The request selected only `id` with `limit=1` and did not print row bodies.

| Table | HTTP status | Rows returned | Content-Range |
| --- | ---: | --- | --- |
| `subscription_payments` | 200 | no | `*/0` |
| `user_subscriptions` | 200 | no | `*/0` |
| `reservations` | 200 | no | `*/0` |
| `leads` | 200 | no | `*/0` |
| `user_notifications` | 200 | no | `*/0` |
| `ai_consultations` | 200 | no | `*/0` |
| `partner_conversations` | 200 | no | `*/0` |

Interpretation:

- The SQL Editor `set local role anon` count result did not reproduce through the live REST anon path.
- No row body was returned for the reviewed sensitive tables through the actual anon API path.
- This lowers the RLS finding from a No-Go candidate back to a conditional audit item.

## Targeted Auth Isolation E2E

After REST anon verification, the auth/RLS isolation and payment security subset was rerun separately:

- Command scope:
  - `tests/e2e/auth.dataIsolation.spec.ts`
  - `tests/e2e/auth.edgeFunctions.spec.ts`
  - `tests/e2e/reservation.payment.spec.ts`
- Result: 16 passed

Covered checks included:

- Anonymous client cannot read protected notification rows
- User A cannot read user B notification
- User A cannot read user B reservation directly
- Logout invalidates the old access token for a protected Edge Function
- Missing or tampered Edge Function authorization is rejected
- Regular user is blocked from admin-only Edge Function paths
- Facility admin cannot update another facility bot data
- Wrong user cannot verify another user's payment
- Payment amount tampering is detected

The skipped full-suite tests were identified as:

- `tests/e2e/review-delete.spec.ts`: manual quarantine review deletion verification
- `tests/e2e/superAdmin.joinChat.spec.ts`: quarantine join-chat and locking scenarios

Interpretation:

- The skipped tests are quarantined/manual coverage, not the core RLS data-isolation checks reviewed in this audit.
- The targeted rerun strengthens the finding that the REST anon result is the relevant production-facing signal, not the SQL Editor count simulation alone.

## Current Release Decision

RLS activation and automated tests are strong passing signals. However, the anon count result on sensitive tables prevents a full release approval from an RLS audit perspective.

Current decision after REST anon verification:

- `Conditional Go`

Reason:

- No confirmed production outage or confirmed REST-level data leak has been established.
- Sensitive-table anon count visibility was observed in SQL Editor role simulation, but live REST anon requests returned no rows for the reviewed sensitive tables.
- Remaining approval blockers are now search-domain metadata mismatch and residual CORS/origin review. Authenticated A/B isolation has direct E2E support from the 16-test targeted rerun.

## Next Verification Targets

Continue with evidence-only checks:

- Confirm whether anon can retrieve row bodies from the sensitive tables, not only counts. REST anon check returned no rows on 2026-04-08.
- Confirm whether Supabase REST API anon key behavior matches or differs from the SQL Editor `set local role anon` result. It differed on 2026-04-08: SQL Editor count showed rows, REST anon returned no rows.
- Confirm authenticated user A cannot access user B rows for the sensitive tables. Targeted E2E passed on 2026-04-08 for notifications and reservations, plus payment IDOR.
- Confirm skipped Playwright tests are not release-critical RLS coverage. Skipped tests were manual/quarantine review deletion and super-admin join-chat locking scenarios.
- Keep the robots/sitemap domain mismatch as a separate release approval issue.
