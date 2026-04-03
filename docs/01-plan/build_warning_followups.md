# Build Warning Follow-ups

Date: 2026-04-03

## Context

`npm run verify` completed successfully after the map marker, ending note, legal modal, and dashboard text fixes.

Build warnings remain and are not blockers for the current patch, but they should be tracked as follow-up work.

## Current status

- Type check: pass
- Lint (`lint:errors`): pass
- Production build: pass
- Remaining warnings: present

## Warning groups

### 1. Mixed static and dynamic imports

Vite reported that these modules are both statically and dynamically imported, so they will not be split into separate chunks:

- `lib/supabaseClient.ts`
- `lib/queries.ts`
- `lib/portone.ts`
- `lib/sangjoQueries.ts`

Impact:

- Not a functional blocker
- Mostly a bundle structure / caching concern
- Can make lazy-loading behavior less predictable

Recommended follow-up:

- Standardize import strategy per module
- Prefer either:
  - mostly static imports for core app modules, or
  - a clear lazy boundary with dynamic imports only where needed

Rollback / caution:

- If import cleanup causes route-level loading regressions or larger initial bundles, revert that cleanup separately from product fixes

### 2. `sharp` / Node builtin browser externalization warnings

Vite reported browser-externalized Node modules via `sharp` and `detect-libc`, including:

- `node:util`
- `node:stream`
- `node:path`
- `node:events`
- `node:os`
- `child_process`
- `fs`

Observed source path:

- `lib/security/imageSanitize.ts`
- `lib/security/fileValidation.ts`

Current code path:

- Browser path uses `createImageBitmap`
- Fallback path dynamically imports `sharp`

Risk:

- Build succeeds today
- In browser environments without `createImageBitmap`, the fallback path may be unsafe or unavailable
- This is a medium-priority structural issue, not a blocker for the current patch

Recommended follow-up:

- Remove `sharp` from browser-reachable code paths
- Move `sharp` logic to a server-only utility, or
- Fail safely in browser instead of attempting `sharp` import

Validation after follow-up:

- Re-run `npm run verify`
- Test image upload on supported browsers
- Test failure behavior on environments where `createImageBitmap` is unavailable

### 3. Supabase package wrapper warning

Build output included warnings around:

- `@supabase/supabase-js/dist/esm/wrapper.mjs`

Impact:

- Build still succeeds
- No direct evidence that the current patch introduced this
- Needs smoke testing rather than immediate code change

Recommended follow-up:

- Run manual smoke tests for:
  - login
  - facility fetch
  - ending note save
  - image upload

If any runtime issue appears:

- Re-check package version compatibility
- Isolate whether the warning is package-version-specific or bundler-resolution-specific

## Priority

1. `sharp` in browser-reachable paths
2. Supabase smoke verification
3. Mixed import cleanup for chunking consistency

## Notes

- These follow-ups are intentionally separated from the current UX fix commit.
- Do not bundle warning cleanup into unrelated product fixes unless the runtime issue is reproduced.
