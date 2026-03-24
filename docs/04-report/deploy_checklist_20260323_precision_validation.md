# Deploy Checklist 2026-03-23

## Scope

- Super admin partner status UX regression fix
- Free-plan share limit validation
- Revenue aggregation consistency validation

## Code Changes Validated

- `components/SuperAdmin/PartnerDetailModal.tsx`
- `components/SuperAdmin/PartnerManagement.tsx`
- `components/IntegratedJourneyView.tsx`
- `hooks/useFinancials.ts`
- `tests/e2e/superAdmin.partnerStatus.spec.ts`
- `lib/api/superAdmin.ts`

## Validation Results

### PASS: Static checks

- `npm run typecheck`
- `npm run build`

### PASS: Super admin partner status UX

- Release-critical E2E added and validated
- Covered flows:
  - detail modal `approved -> suspended`
  - detail modal `approved -> rejected`
  - detail modal `suspended -> approved`
  - list card buttons without opening detail modal

### PASS: Share limit data validation

- Validation basis: same query shape used by app
- Table: `user_shares`
- Filter: `user_id = current user` and `is_active = true`
- Observed counts:
  - no active shares -> `0`
  - inactive only -> `0`
  - one active + one inactive -> `1`
  - two active + one inactive -> `2`
- Conclusion: free-plan 1-share limit query is correct after switching from `journey_shares` to `user_shares`

### PASS: Revenue number validation

- Additional fix applied in `lib/api/superAdmin.ts`
  - normalize `completed -> succeeded`
  - resolve facility name from `facility_subscriptions` + `facilities` without relying on broken view join only
- Synthetic fixture validation:
  - all statuses sum = `34000`
  - succeeded-only sum = `17000`
  - excluded non-succeeded sum = `17000`
  - current-month succeeded sum = `10000`
- Current real data validation after fix:
  - payment rows read = `3`
  - succeeded-only sum = `464000`
- Conclusion: revenue totals no longer collapse to `0` when DB rows use `completed`

## Findings

### Data issue: facility reference missing

- Current subscription row sample:
  - subscription id: `81dbe8c8-8942-4b17-98fe-cc8057df3722`
  - `facility_id_uuid = ec725a14-68a4-4f52-b880-e1df86c2cd48`
  - matching row in `facilities` not found
- Impact:
  - revenue screen shows `(시설 정보 유실)` for current payment rows
  - this is a DB integrity issue, not a code resolution issue

### Release-critical suite status

- Command: `npx playwright test --grep @release-critical --reporter=line --workers=1`
- Result after revenue fix: `1 failed, 7 passed, 3 did not run`
- Failing test:
  - `tests/e2e/core.flows.spec.ts`
  - `@release-critical C2-4: create review`
- Failure symptom:
  - facility card not found / serial fixture dependency broke inside the suite
- Assessment:
  - unrelated to the super-admin status fix
  - unrelated to the revenue normalization fix
  - still blocks declaring the full release-critical suite green

## Deployment Readiness

- Partner status UX fix: ready
- Share limit fix: ready
- Revenue totals fix: ready
- Full release-critical suite: not fully green due `C2-4`

## Recommended Next Actions

1. Fix or quarantine `C2-4` serial dependency issue in `tests/e2e/core.flows.spec.ts`
2. Backfill or clean orphaned `facility_subscriptions -> facilities` references
3. Commit the `lib/api/superAdmin.ts` revenue normalization fix after review
