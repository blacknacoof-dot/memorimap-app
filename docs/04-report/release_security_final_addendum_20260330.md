# Memorimap Release Security Final Addendum

Date: 2026-03-30

This addendum records the final security state that was applied after the original
`release_security_patch_status_20260330.md` report.

## Final Applied State

### Storage

- `partner_docs`: private + signed URL
- `facility-images`: public 유지
- `review-images`: private + signed URL

Note:
- Production review image bucket name is `review-images`, not `reviews`.
- App code, migration, and runtime checks were aligned to `review-images`.

### Storage Policy Final Verification

Executed checks:
- storage INSERT/select policy inspection
- storage bucket public/private inspection

Observed final results:
- `review-images` bucket is private
- `partner_docs` bucket is private
- `facility-images` bucket is public
- active INSERT policy exists for `bucket_id = 'review-images'`
- legacy policy `Authenticated Upload reviews` has been removed

Decision:
- Release blocker resolved
- Storage configuration passes launch criteria
- Stale policy cleanup completed

### Direct URL Verification

- old `review-images` public URL: blocked (`400 Bad Request`)
- fresh signed `review-images` URL: `200 OK`
- `facility-images` public URL: `200 OK`

Interpretation:
- Review images are no longer reachable through old direct public object URLs.
- Signed URLs remain valid for authorized app access.
- Facility images continue to behave as public marketing assets.

## Edge Function Hardening

### Applied patches

- `gemini-proxy`
  - Removed external `details` exposure
  - External failure response reduced to `{"error":"AI request failed"}`
  - Internal failure details kept in logs only
  - Added DB-backed rate limiting

- `approve-partner`
  - Removed raw request `body` from `system_logs.meta`
  - Kept minimal metadata only: `inquiryId`, `action`, `error`
  - Added DB-backed rate limiting

- `verify-payment`
  - Added DB-backed rate limiting

### Related files

- `supabase/functions/gemini-proxy/index.ts`
- `supabase/functions/approve-partner/index.ts`
- `supabase/functions/verify-payment/index.ts`
- `supabase/functions/_shared/rateLimit.ts`
- `supabase/migrations/20260330190000_edge_function_rate_limits.sql`

## Runtime Verification

### Rate limit confirmation

- `gemini-proxy`: first `429` at request `31`
- `approve-partner`: first `429` at request `11`
- `verify-payment`: first `429` at request `21`
- `Retry-After` header confirmed

### Deployment confirmation

- Supabase migrations applied:
  - `20260330173000_make_reviews_private.sql`
  - `20260330190000_edge_function_rate_limits.sql`
- Supabase function redeploy completed:
  - `gemini-proxy`
  - `approve-partner`
  - `verify-payment`
  - `deploy-bot-data`
- Vercel production deploy completed for the related app changes

## Final Release Decision

- `Release Ready: YES`
- `Risk Level: LOW`

Launch interpretation:
- Storage launch criteria: PASS
- Edge Function hardening: PASS
- Final release decision: GO

## Remaining Post-release Improvements

- Remove CSP `unsafe-inline`
- Standardize Edge Function error responses further
- Add CI secret scanning and built-asset grep checks
