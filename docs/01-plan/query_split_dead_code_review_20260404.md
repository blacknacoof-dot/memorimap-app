# Query Split Dead Code Review

Date: 2026-04-04

## Scope

- `lib/queries.ts` split follow-up
- dead-code review only
- no function deletion in this step

## Current Status

- `lib/queries/index.ts` created
- `lib/queries/subscription.ts` created
- subscription read-path imports moved to the new entrypoint
- `npm run typecheck` passed
- `npm run build` passed
- remaining build output is limited to the third-party `@supabase/supabase-js` warning

## Review-Delete Candidates

### 1. `getReviews`

- current role: original facility review read function in `lib/queries.ts`
- replacement path: `lib/queries/reviews.ts`
- app direct usage: not found
- internal reference: `getReviewsBySpace = getReviews` alias remains in `lib/queries.ts`
- current decision: review-delete

Pre-delete checklist:

- confirm no app import remains
- confirm no hidden dependency on `getReviewsBySpace = getReviews`
- confirm no usage in tests, scripts, or admin utilities
- clean up stale docs or legacy import examples if they exist

### 2. `getUserReviews`

- current role: user review list read function in `lib/queries.ts`
- replacement path: `lib/queries/reviews.ts`
- app direct usage: not found
- internal reference: not found
- current decision: review-delete

Pre-delete checklist:

- confirm no app import remains
- confirm no usage in tests, scripts, or admin utilities
- confirm replacement keeps the same signature and return shape
- clean up stale docs or legacy import examples if they exist

### 3. `getFacilityConsultations`

- current role: deprecated alias for `getConsultationsByFacility`
- replacement path: `getConsultationsByFacility` in `lib/queries.ts`
- app direct usage: not found
- internal reference: deprecated alias only
- current decision: review-delete, but more conservative than review functions

Pre-delete checklist:

- confirm no app import remains
- confirm no hidden admin or operational path still uses the alias name
- confirm no tests or scripts still reference the legacy alias
- clean up deprecated docs or legacy import examples if they exist

## Hold Candidates

The following remain out of deletion scope for now:

- `createNotice`
- `getNotices`

Reason:

- code usage is sparse, but the replacement path is still validated mainly by design notes and admin-flow review rather than a final removal check

## Ready-For-Review Result

Based on the current search scope:

- ready-for-review:
  - `getReviews`
  - `getUserReviews`
- hold:
  - `getFacilityConsultations`

## Next Safe Step

Prepare a deletion PR checklist for:

- `getReviews`
- `getUserReviews`

Leave actual removal of:

- `getFacilityConsultations`
- `createNotice`
- `getNotices`

for a later pass after one more conservative verification round.
