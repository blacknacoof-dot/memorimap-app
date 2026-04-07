# Work Log 2026-04-06

## Summary

- Investigated the remaining map marker drop-out during zoom in/out.
- Aligned viewport query behavior between frontend and DB.
- Deployed the zoom-refresh marker fix to Vercel production.
- Confirmed that the remaining dirty worktree files are not part of the deployed marker fix.

## 1. Marker Stability Research

- Confirmed that two different map visuals were being mixed:
  - numeric markers: cluster markers
  - icon markers: individual facility markers
- Verified that the remaining "disappear / reappear" behavior was not only a cluster UX issue.
- Identified two real consistency issues:
  - viewport RPC could diverge from the initial facility list contract
  - zoom-only changes were not always treated as a meaningful viewport refresh

## 2. DB / Query Alignment

- Committed:
  - `d91ea35` `fix(map): stabilize viewport markers and align verified filter`
- Updated viewport facility query handling in `lib/queries.ts`
  - transient RPC failures no longer clear the marker set with `[]`
- Added migration:
  - `supabase/migrations/20260406160000_align_viewport_verified_filter.sql`
- Result:
  - viewport search is aligned to `verified = true`
  - DB-side inconsistency with initial list contract was removed

Note:

- The SQL was applied directly in the database during verification.

## 3. Frontend Zoom Refresh Fix

- Committed:
  - `fbfb9cf` `fix(map): refresh viewport markers on zoom changes`
- Updated `hooks/useMapViewport.ts`
  - included `zoom` in the viewport signature
  - treat zoom-only changes as meaningful viewport changes
  - sync `currentBounds` immediately on map bounds change

Effect:

- zoom in/out now re-evaluates the visible facility set
- stale viewport results are less likely to remain attached during zoom-only interaction

## 4. Release Status

- `npm run build` passed
- `git push origin main` completed
- Vercel production deployment completed
- Production alias confirmed:
  - `https://memorimap.kr`
- Deployed marker-fix commit:
  - `fbfb9cf`

## 5. Remaining Local Changes

Current dirty files after deployment:

- `.claude/settings.local.json`
- `.tsbuildinfo`
- `supabase/.temp/cli-latest`
- `utils/facilityNormalizer.ts`

Assessment:

- These files were not included in the marker-fix commits.
- These files were not required for the Vercel deployment that resolved the map marker issue.
- They should be treated as separate local/documentation or non-release follow-up items unless reviewed and committed intentionally.

## Conclusion

- The marker stability fix was committed, pushed, and deployed.
- The remaining dirty worktree files are not part of the deployed marker release.
