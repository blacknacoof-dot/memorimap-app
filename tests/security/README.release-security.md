# Release Security Test Guide

This document lists the release-blocking security tests for Memorimap.

## Preconditions

- Node.js dependencies installed
- `.env.local` or shell env contains the required Supabase values for E2E:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Supabase migrations already applied in the target environment
- Edge Functions redeployed when relevant

## Test Matrix

### 1. Authentication / Authorization

- `tests/e2e/auth.edgeFunctions.spec.ts`
- `tests/e2e/auth.dataIsolation.spec.ts`
- `tests/e2e/auth.roleAccess.spec.ts`
- `tests/e2e/report.smoke.spec.ts`

Purpose:
- unauthenticated access blocked
- admin-only APIs blocked for regular users
- cross-user data access blocked
- cron-only report endpoint enforced

Run:

```bash
npx playwright test tests/e2e/auth.edgeFunctions.spec.ts tests/e2e/auth.dataIsolation.spec.ts tests/e2e/auth.roleAccess.spec.ts tests/e2e/report.smoke.spec.ts --reporter=line --workers=1
```

Pass criteria:
- `401` for missing/tampered auth
- `403` for unauthorized admin access
- no cross-user row access
- `send-monthly-report` rejects non-cron calls

### 2. Input Validation / XSS / Redirect

- `tests/e2e/security.xss.spec.ts`
- `lib/security/sqlSanitize.test.ts`
- `lib/validation/reviewSchema.test.ts`
- `lib/validation/facilitySchema.test.ts`
- `src/utils/browserDetection.test.ts`

Purpose:
- XSS payloads render inertly
- search normalization stays strict
- review/facility validation stays enforced
- external redirect stays same-origin only

Run:

```bash
npx playwright test tests/e2e/security.xss.spec.ts --reporter=line --workers=1
npx vitest run lib/security/sqlSanitize.test.ts lib/validation/reviewSchema.test.ts lib/validation/facilitySchema.test.ts src/utils/browserDetection.test.ts
```

Pass criteria:
- no `script`, `javascript:` links, or inline event handlers survive
- invalid URL / oversized text rejected
- external redirect values are normalized away

### 3. Upload Security

- `tests/security/upload.spec.ts`
- `lib/security/fileValidation.test.ts`

Purpose:
- EXIF metadata stripped
- spoofed or undecodable image rejected
- signed URL generation works for private review images
- facility public image compatibility preserved

Run:

```bash
npx vitest run tests/security/upload.spec.ts lib/security/fileValidation.test.ts
```

Pass criteria:
- metadata removed
- invalid image rejected
- review image signed URL generated
- arbitrary external review image URL rejected

### 4. Edge Function Error Exposure / Rate Limit / Release Config

- `tests/security/edgeContracts.spec.ts`
- `tests/security/releaseConfig.spec.ts`

Purpose:
- `gemini-proxy` generic external errors only
- `approve-partner` raw request body not logged
- rate-limit helper wired into target functions
- release config keeps source maps off, `unsafe-eval` absent, `ai-test` blocked

Run:

```bash
npx vitest run tests/security/edgeContracts.spec.ts tests/security/releaseConfig.spec.ts
```

Pass criteria:
- no `details` exposure regressions
- no raw `body` logging regression
- rate limit helper/migration present
- release config stays hardened

## Recommended Full Run

```bash
npm run typecheck
npx vitest run lib/security/sqlSanitize.test.ts lib/validation/reviewSchema.test.ts lib/validation/facilitySchema.test.ts src/utils/browserDetection.test.ts lib/security/fileValidation.test.ts tests/security/upload.spec.ts tests/security/edgeContracts.spec.ts tests/security/releaseConfig.spec.ts
npx playwright test tests/e2e/auth.edgeFunctions.spec.ts tests/e2e/auth.dataIsolation.spec.ts tests/e2e/auth.roleAccess.spec.ts tests/e2e/report.smoke.spec.ts tests/e2e/security.xss.spec.ts --reporter=line --workers=1
```

## Expected Failure Signals

- `401`/`403` missing from auth tests
- `429` guard removed from hardened Edge Functions
- `details` field reappears in `gemini-proxy`
- raw body logging returns in `approve-partner`
- `unsafe-eval` appears in CSP
- review image direct/public handling regresses
