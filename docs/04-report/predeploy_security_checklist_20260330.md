# Memorimap Pre-Deploy Security Checklist

Date: 2026-03-30
Scope: release-blocking security checks immediately before production deployment
Status target: GO only when all release-blocking items pass

## 1. Release Scope

- Target web app: `memorimap-app` on Vercel production
- Target Supabase project ref: `xvmpvzldezpoxxsarizm`
- Target Edge Functions:
  - `verify-payment`
  - `approve-partner`
  - `gemini-proxy`
  - `deploy-bot-data`

## 2. Preconditions

- [ ] current release commit is identified
- [ ] required env vars exist in target environment
- [ ] latest Supabase migrations are applied
- [ ] relevant Edge Functions are redeployed
- [ ] no unresolved Critical or High findings remain

## 3. Storage / Policy Checks

- [ ] `review-images` bucket exists and `public = false`
- [ ] `partner_docs` bucket exists and `public = false`
- [ ] `facility-images` bucket exists and `public = true`
- [ ] active INSERT policy exists for `bucket_id = 'review-images'`
- [ ] stale `reviews` upload policy is absent

Verification SQL:

```sql
select
  policyname,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
and tablename = 'objects'
order by policyname;
```

```sql
select id, name, public
from storage.buckets
where id in ('review-images', 'reviews', 'facility-images', 'partner_docs')
order by id;
```

Failure criteria:
- `review-images` is public
- `partner_docs` is public
- upload policy still points to `reviews`

## 4. Edge Function Deployment Checks

- [ ] `verify-payment` latest code deployed
- [ ] `approve-partner` latest code deployed
- [ ] `gemini-proxy` latest code deployed
- [ ] function secrets exist in production

Required secrets:
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORTONE_API_SECRET`
- `GOOGLE_GENAI_API_KEY`
- `RESEND_API_KEY`

Failure criteria:
- deployment failed
- function still returns old error shape
- required secret missing

## 5. Web Release Config Checks

- [ ] production build has sourcemaps disabled
- [ ] production CSP excludes `unsafe-eval`
- [ ] `/ai-test.html` blocked
- [ ] HSTS / frame / content-type headers present

Command:

```powershell
npx vitest run tests/security/releaseConfig.spec.ts
```

Failure criteria:
- any test fails

## 6. Auth / Authz Checks

- [ ] missing auth returns `401`
- [ ] tampered token returns `401`
- [ ] regular user blocked from admin-only functions with `403`
- [ ] cross-user data access returns no rows
- [ ] super admin role RPC still resolves correctly

Command:

```powershell
npx playwright test tests/e2e/auth.edgeFunctions.spec.ts tests/e2e/auth.dataIsolation.spec.ts tests/e2e/auth.roleAccess.spec.ts --reporter=line --workers=1
```

Failure criteria:
- admin-only API callable by regular user
- cross-user notification or reservation becomes readable
- role RPC returns unexpected role or missing super admin state

## 7. Input / XSS / Upload Checks

- [ ] review XSS payload renders inertly
- [ ] invalid review/facility payload rejected
- [ ] spoofed image upload rejected
- [ ] private review image uses signed URL path only

Commands:

```powershell
npx playwright test tests/e2e/security.xss.spec.ts --reporter=line --workers=1
npx vitest run lib/security/sqlSanitize.test.ts lib/validation/reviewSchema.test.ts lib/validation/facilitySchema.test.ts lib/security/fileValidation.test.ts tests/security/upload.spec.ts
```

Failure criteria:
- executable script or `javascript:` survives
- oversized or invalid payload accepted
- private review image exposed as public object URL

## 8. Hardened Edge Contract Checks

- [ ] `verify-payment` hides internal error details
- [ ] `gemini-proxy` hides upstream/auth details
- [ ] `approve-partner` does not log raw request body
- [ ] rate-limit helper remains wired

Command:

```powershell
npx vitest run tests/security/edgeContracts.spec.ts
```

Failure criteria:
- `details` field appears in hardened responses
- raw body logging reappears
- rate limit contract removed

## 9. Deployment Sequence

1. Apply latest Supabase migrations
2. Redeploy relevant Edge Functions
3. Run release-blocking security tests
4. Deploy Vercel production
5. Verify live headers and critical Edge Function responses
6. Record final decision in release report

## 10. Final Decision Gate

Release GO:
- all release-blocking checks pass
- no unresolved Critical or High issue remains

Release HOLD:
- any auth, storage, upload, or hardened Edge Function check fails
- any required production secret is missing
- production deployment does not match tested artifacts
