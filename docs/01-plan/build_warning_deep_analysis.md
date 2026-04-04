# Build Warning Deep Analysis

Date: 2026-04-03
Updated: 2026-04-04

## Status

- `sharp`-related browser bundle risk: resolved
- mixed static/dynamic import warnings around app code: resolved
- remaining build output: third-party `@supabase/supabase-js` wrapper warning

## What Was Resolved

### 1. Browser-reachable `sharp` fallback

Previous concern:

- browser-reachable upload validation/sanitize code referenced `sharp`
- Vite warned because Node-only modules could leak into the browser graph

Current state:

- [imageSanitize.ts](C:/Users/black/Desktop/memorimap/lib/security/imageSanitize.ts) now uses browser sanitization only
- [fileValidation.ts](C:/Users/black/Desktop/memorimap/lib/security/fileValidation.ts) now fails safely when browser decode support is unavailable
- targeted tests passed:
  - `lib/security/fileValidation.test.ts`
  - `tests/security/upload.spec.ts`

Result:

- no app-level build warning remains for `sharp`

### 2. Mixed static/dynamic imports

Previous concern:

- the same modules were imported both statically and dynamically, so Vite warned that dynamic imports would not produce separate chunks

Resolved call sites:

- [useUserRole.ts](C:/Users/black/Desktop/memorimap/hooks/useUserRole.ts)
- [useFacilityAdmin.ts](C:/Users/black/Desktop/memorimap/components/dashboard/useFacilityAdmin.ts)
- [SubscriptionPlans.tsx](C:/Users/black/Desktop/memorimap/components/SubscriptionPlans.tsx)
- [useFacilityData.ts](C:/Users/black/Desktop/memorimap/hooks/useFacilityData.ts)
- [BrandScenario/index.tsx](C:/Users/black/Desktop/memorimap/components/sangjo/BrandScenario/index.tsx)
- [queries.ts](C:/Users/black/Desktop/memorimap/lib/queries.ts)

Result:

- previous app-level Vite warnings for:
  - `lib/queries.ts`
  - `lib/queries/reviews.ts`
  - `lib/portone.ts`
  - `lib/sangjoQueries.ts`
  are no longer emitted by `npm run build`

## Remaining Warning

Current build still prints:

- `node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs` default export warning

Assessment:

- this is from the dependency bundle, not from the project import graph touched in the 2026-04-03 refactor
- app build completes successfully
- this can be handled separately by dependency/version investigation if needed

## Verification

Executed successfully on 2026-04-04:

- `npm run typecheck`
- `npx vitest run lib/security/fileValidation.test.ts`
- `npx vitest run tests/security/upload.spec.ts`
- `npm run build`

## Follow-up

- if desired, next cleanup step is reducing duplication that still remains in [queries.ts](C:/Users/black/Desktop/memorimap/lib/queries.ts) after the query-splitting refactor
