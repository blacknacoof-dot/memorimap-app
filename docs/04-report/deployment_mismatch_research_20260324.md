# Deployment Mismatch Research Report

Date: 2026-03-24
Project: `memorimap-app`
Author: Codex

## Summary

The production site currently does not match the current local workspace state.

This mismatch explains why previously fixed UI behavior is not visible in production, including:

- recommended facility card behavior not matching expected local behavior
- layout overlap / stale interaction behavior still appearing on deployed pages

The issue is not just "cache" or "browser refresh". The deployed bundle hash is different from the current local build output.

## Scope

This report focuses on:

- whether the deployed site reflects the current local source
- whether recent production deployments were built from the expected source state
- what deployment method is safest next

## Key Findings

### 1. Production bundle does not match the current local build

The live domains below currently serve the same JS/CSS bundle references:

- `https://memorimap.kr`
- `https://memorimap-app.vercel.app`

Observed live bundle references:

- `assets/index-DNNwxQ05.js`
- `assets/index-CXAj6KUk.css`

Current local build outputs observed during investigation:

- `index-7bU2-GD8.js`
- `index-DU48GSGe.js`
- `index-CL3AE2IR.css`

Conclusion:

- production is not serving the same build output as the current local workspace

### 2. Latest local commit is not enough to represent the current workspace

Current local `HEAD`:

- `ca0f722` `fix(mobile): expand recommended facility names and load naver sdk at runtime`

However, the local workspace still contains additional uncommitted changes. That means:

- `HEAD` does not fully represent the current working state
- even if a deployment was made from `HEAD` or a clean worktree, it could still miss important local fixes

### 3. Earlier production deployments were created from a reduced clean worktree

Recent production deployments observed:

- `https://memorimap-3rvon3rvi-ptys-projects.vercel.app`
- `https://memorimap-2lk5l37ez-ptys-projects.vercel.app`
- `https://memorimap-7x3l5mljg-ptys-projects.vercel.app`

During the investigation, clean worktrees were used to avoid deploying unrelated dirty files.

That was safe from a source control perspective, but it likely excluded local fixes that only exist in the current dirty workspace.

### 4. Some local behavior fixes are still uncommitted

Examples of currently modified files outside the committed deployment fix:

- [components/ConsultationList.tsx](/C:/Users/black/Desktop/memorimap/components/ConsultationList.tsx)
- [components/dashboard/useFacilityAdmin.ts](/C:/Users/black/Desktop/memorimap/components/dashboard/useFacilityAdmin.ts)
- [components/AppMainLayout.tsx](/C:/Users/black/Desktop/memorimap/components/AppMainLayout.tsx)
- [components/dashboard/facility/ReservationManager.tsx](/C:/Users/black/Desktop/memorimap/components/dashboard/facility/ReservationManager.tsx)

At least some of these files contain behavior changes not present in the last committed deployment-safe subset.

This is the strongest explanation for the user's report that "it was already fixed before, but deployed behavior still looks old."

### 5. Current code path for recommended facility card click does not open the facility sheet directly

After deeper code tracing, the recommended facility cards inside the AI recommendation forms currently follow this path:

1. A recommendation card button is clicked inside one of:
   - [components/AI/FuneralSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/FuneralSearchForm.tsx)
   - [components/AI/MemorialSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/MemorialSearchForm.tsx)
   - [components/AI/PetSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/PetSearchForm.tsx)
2. That button calls `onSwitchToFacility(...)`
3. `ChatInterface` forwards that callback unchanged:
   - [components/AI/ChatInterface.tsx](/C:/Users/black/Desktop/memorimap/components/AI/ChatInterface.tsx)
4. `ModalContainer` handles it in `handleSwitchToFacility(...)`:
   - [components/ModalContainer.tsx](/C:/Users/black/Desktop/memorimap/components/ModalContainer.tsx)

What `handleSwitchToFacility(...)` currently does:

- reads conversation context
- calls `setAiChatFacility(target as Facility)`
- calls `setHandoverContext(...)`

What it does **not** do:

- does not call `setSelectedFacility(...)`
- does not clear the AI overlay first
- does not navigate view state
- does not explicitly open `FacilitySheet`

This means the current code behavior is:

- recommendation card click switches the active AI chat target
- the global AI overlay remains mounted
- the user does **not** get a direct facility sheet transition from that click path

This is a concrete code-level explanation for the user perception that the recommendation card behavior is "not closing as before".

### 6. `FacilitySheet` and AI overlay are controlled by different states

The relevant modal states in [App.tsx](/C:/Users/black/Desktop/memorimap/App.tsx) and [components/ModalContainer.tsx](/C:/Users/black/Desktop/memorimap/components/ModalContainer.tsx) are:

- `selectedFacility`
- `aiChatFacility`
- `viewState`

Rendering conditions:

- `FacilitySheet` renders only when `selectedFacility` is truthy
- Global AI overlay renders only when `aiChatFacility` is truthy

Because `handleSwitchToFacility(...)` updates only `aiChatFacility`, the system stays in AI overlay mode instead of transitioning to facility-sheet mode.

This behavior is independent from bundle mismatch. Even if the current local source were deployed exactly, this specific code path would still not directly open the sheet unless another uncommitted local change changes that behavior elsewhere.

### 7. My Page overlap is less likely to be caused by `onGoToMyPage`

The `onGoToMyPage` path in [components/ModalContainer.tsx](/C:/Users/black/Desktop/memorimap/components/ModalContainer.tsx) explicitly does:

- `setAiChatFacility(null)`
- `setInitialChatIntent(null)`
- `setViewState(ViewState.MY_PAGE)`

This suggests the "My Page overlap" symptom is probably **not** caused by the explicit My Page button path itself.

More likely explanations:

- the user is observing the recommendation-card click path, which keeps the AI overlay active
- production is running an older bundle with behavior that differs from the current workspace
- another layout-related local change exists outside the last deployment subset

### 8. Current code evidence does not support the claim that the live production behavior fully reflects the current workspace

Combined evidence:

- live bundle hash mismatch
- uncommitted local files exist
- recommendation-card click path currently routes through AI chat target handoff, not sheet opening

Therefore, production verification must include both:

- source parity verification
- user-flow verification for the exact click path

## Supporting Evidence

### Vercel deployment list

Recent production deployments were confirmed via Vercel CLI.

Most recent production deployment at time of investigation:

- `memorimap-3rvon3rvi-ptys-projects.vercel.app`

### Production bundle hash check

The live domains were queried directly and both returned identical asset references:

- `assets/index-DNNwxQ05.js`
- `assets/index-CXAj6KUk.css`

This confirms both domains are aligned with each other, but not aligned with the current local build output.

### Local build verification

`npm run build` succeeds locally.

The local build output produces different bundle names than the current production site, proving source/build mismatch.

### Reviewed staging build verification

A reviewed staging source set was assembled in:

- [\.stage_reviewed_deploy](/C:/Users/black/Desktop/memorimap/.stage_reviewed_deploy)

That staged source includes the currently approved deployment candidates:

- recommendation-card mobile UI files
- Naver Maps runtime loader files
- consultation/admin behavior files

Build result from that staged source:

- `assets/index-I5hn3X4s.js`
- `assets/index-CL3AE2IR.css`

This staged build succeeds locally and is different from the currently live production HTML references:

- live JS: `assets/index-DNNwxQ05.js`
- live CSS: `assets/index-CXAj6KUk.css`

This proves the currently reviewed deployment set is not what production is serving now.

### Partial live-bundle string evidence

The live production JS bundle at `assets/index-DNNwxQ05.js` was inspected for concrete strings tied to the reviewed local changes.

Found in live JS:

- `text-[15px]`
- `break-keep`
- `추천 `

Missing from live JS:

- `is_ai_consultation`
- `AI 상담은 답변할 수 없습니다`

Interpretation:

- the mobile recommendation-card typography changes appear to be present in the currently live bundle
- the consultation/admin AI-item handling changes do not appear to be present in the currently live bundle

This strongly suggests production is currently in a mixed state where some recent UI changes were deployed, but some newer local consultation/admin behavior changes were not.

### State-flow verification

Relevant state ownership:

- [App.tsx](/C:/Users/black/Desktop/memorimap/App.tsx)
- [components/ModalContainer.tsx](/C:/Users/black/Desktop/memorimap/components/ModalContainer.tsx)
- [components/ContentRouter.tsx](/C:/Users/black/Desktop/memorimap/components/ContentRouter.tsx)
- [components/MyPageView/index.tsx](/C:/Users/black/Desktop/memorimap/components/MyPageView/index.tsx)

Observed behavior by code inspection:

- `FacilitySheet` is not driven by `onSwitchToFacility`
- recommendation-card click currently rebinds the AI context instead of opening detail sheet state
- My Page rendering is view-state driven in `ContentRouter`
- AI overlay rendering is modal-state driven in `ModalContainer`

These states are independent and must be validated together in deployment verification.

### Additional state-flow verification: My Page overlap path

Further code tracing shows that `MyPage` and `FacilitySheet` are not mutually exclusive in the current architecture.

Relevant facts:

- `MyPageView` is rendered by `ContentRouter` only when `viewState === ViewState.MY_PAGE`
- `FacilitySheet` is rendered by `ModalContainer` whenever `selectedFacility` is truthy
- `ModalContainer` does not require `viewState === ViewState.MAP` for `FacilitySheet`

This means the following state combination is valid in the current code:

- `viewState = ViewState.MY_PAGE`
- `selectedFacility = some facility`

When that happens:

- My Page remains rendered in the background
- `FacilitySheet` overlays on top of it

This is not a deployment artifact by itself. It is a direct consequence of the current state model.

### Concrete My Page overlap trigger

The `MyPage` stack passes `onSelectFacility={handleFacilitySelect}` through:

- [components/ContentRouter.tsx](/C:/Users/black/Desktop/memorimap/components/ContentRouter.tsx)
- [components/MyPageView/index.tsx](/C:/Users/black/Desktop/memorimap/components/MyPageView/index.tsx)
- [components/MyPageView/ReservationTabs.tsx](/C:/Users/black/Desktop/memorimap/components/MyPageView/ReservationTabs.tsx)
- [components/MyPageView/FavoriteTabs.tsx](/C:/Users/black/Desktop/memorimap/components/MyPageView/FavoriteTabs.tsx)

`handleFacilitySelect` in [hooks/useFacilityData.ts](/C:/Users/black/Desktop/memorimap/hooks/useFacilityData.ts):

- calls `setSelectedFacility(facility)`
- does not change `viewState`

Therefore, any facility selection initiated inside My Page can intentionally produce:

- `viewState = MY_PAGE`
- `selectedFacility != null`

This is the concrete code path that causes "My Page with facility card/sheet together" rendering.

### Separation from recommended-card click path

This My Page overlap path is different from the AI recommendation-card click path.

Recommended-card click currently does:

- `onSwitchToFacility(...)`
- `handleSwitchToFacility(...)`
- `setAiChatFacility(target)`
- `setHandoverContext(...)`

Recommended-card click currently does not:

- call `setSelectedFacility(...)`
- navigate to `MY_PAGE`

So the current code evidence supports the following distinction:

- recommendation-card click causes AI-overlay handoff behavior
- My Page overlap is caused by `selectedFacility` being opened while `viewState` remains `MY_PAGE`

These are separate mechanisms and should not be conflated during deployment verification.

## Related Findings

### CSP issue

Earlier in the same investigation, production CSP headers were found to be out of sync with repository configuration.

That issue was corrected by re-deploying with updated CSP entries for:

- `https://*.googletagmanager.com`
- `https://*.google-analytics.com`

This confirms that production drift has already happened at least once during this session.

### Naver Maps env warning

The build warning about `VITE_NAVER_MAP_CLIENT_ID` was resolved locally by:

- removing static SDK injection from [index.html](/C:/Users/black/Desktop/memorimap/index.html)
- loading the Naver Maps SDK at runtime in [components/MapContainer.tsx](/C:/Users/black/Desktop/memorimap/components/MapContainer.tsx)

This fix is committed in `ca0f722`, but production still needs to be validated against the intended source set.

## Refined Conclusion

The investigation now supports a two-track explanation:

### 1. Deployment/source mismatch is real

- live bundle hashes still do not match the reviewed staged local build
- live bundle contents show a mixed state where some local changes are present and others are absent

### 2. Some user-observed overlap behavior is also explainable by the current code structure

- recommendation-card click is implemented as AI handoff, not direct facility-sheet open
- My Page and `FacilitySheet` can coexist by design because they are controlled by different states

So not every "overlap" symptom should be attributed only to stale deployment. Some of it is consistent with the current source architecture.

## Expected UX vs Current State Model

This section separates likely user expectations from what the current code actually models.

### User-expected behavior A: recommended facility card acts like a direct detail transition

Likely expectation:

- tap a recommended facility card
- current recommendation overlay closes or steps aside
- the tapped facility opens as the primary detail target
- the user feels they have "moved into" that facility

Current implementation:

- recommendation-card click does not open `FacilitySheet`
- it updates `aiChatFacility`
- the AI overlay remains the primary rendered layer

Gap:

- the implementation behaves like conversational handoff
- the user expectation sounds closer to detail-sheet transition

### User-expected behavior B: My Page should render alone

Likely expectation:

- if the app is in `MY_PAGE`, only My Page content should be visible
- opening a facility from My Page may be expected either to:
  - replace My Page visually, or
  - navigate out of My Page before showing facility details

Current implementation:

- `MyPageView` is controlled by `viewState`
- `FacilitySheet` is controlled independently by `selectedFacility`
- selecting a facility from My Page sets `selectedFacility` without leaving `MY_PAGE`

Gap:

- current state model allows layered rendering
- user expectation is likely single-primary-surface rendering

### User-expected behavior C: "Close" means state reset across related overlays

Likely expectation:

- when moving from AI recommendation flow to another main surface, the prior AI context should be fully dismissed
- when moving into My Page, no previous modal/sheet state should leak visually

Current implementation:

- some routes explicitly clear `aiChatFacility`
- other routes only set `selectedFacility`
- modal/sheet states are not centrally normalized into a single active surface model

Gap:

- the app currently allows multiple independently valid UI layers
- user expectation appears closer to a single-focus navigation model

## Product Interpretation

From a product behavior standpoint, the current UI seems to mix two different paradigms:

- page/view navigation via `viewState`
- overlay-driven workflow via `selectedFacility` and `aiChatFacility`

That hybrid model is technically valid, but it increases the chance that users interpret a legitimate layered state as a broken or stale deployment.

For verification purposes, this means:

- some complaints may indicate real deployment mismatch
- some complaints may indicate a mismatch between intended UX and implemented state ownership
- both must be checked separately before deciding what should be deployed next

## Recommended Verification Questions For Future Fix Work

Before any code change, the intended product behavior should be pinned down for these questions:

1. When a user taps a recommended facility card, should the app:
   - stay in AI chat and switch target facility, or
   - open facility detail as the primary surface?
2. When a user opens a facility from My Page, should the app:
   - keep My Page in the background, or
   - navigate away from My Page to map/detail mode?
3. Should the application allow `selectedFacility` and `viewState === MY_PAGE` simultaneously as a supported UX state?
4. Should the application allow `aiChatFacility` and other major surfaces to coexist, or should AI always be exclusive?

These questions are not implementation details. They define whether the currently observed behavior is a bug, a deployment mismatch, or simply the result of an unclear UX contract.

## Risk Assessment

### If we deploy only committed changes

Pros:

- safer, reproducible source state
- easier rollback and audit

Cons:

- likely misses local fixes the user expects
- may keep the currently reported UI bug in production

### If we deploy the full dirty workspace without review

Pros:

- most likely to reflect the exact local behavior the user expects

Cons:

- can accidentally ship unrelated experimental or incomplete changes
- harder to reason about regressions later

### Recommended approach

Best next step:

- review the dirty workspace changes
- classify files into `deploy` vs `exclude`
- stage a clean deployment directory containing only approved local changes
- build from that staged source
- deploy to production
- verify the live bundle hash and behavior after deployment

## Recommended Deployment Procedure

1. Review all modified files in the current workspace.
2. Exclude logs, temp folders, test artifacts, and unrelated notes.
3. Include functional UI/state files that affect the user-reported issue.
4. Build from the staged source.
5. Deploy to production.
6. Query the deployed HTML again and compare the live bundle hash to the staged local build.
7. Verify the specific user flow:
   - tap recommended facility card
   - confirm whether expected behavior is:
     - open facility sheet, or
     - hand off into facility-specific AI overlay
   - confirm no stale overlay remains if navigating to My Page
   - confirm the observed behavior matches the intended code path

## Deployment Review Checklist

Use this checklist before the next production deployment.

### A. Source parity checks

- Confirm current `git rev-parse HEAD`
- Confirm whether important behavior exists only in dirty workspace changes
- Confirm which modified files are intentionally deployable
- Confirm no `.stage_*` or `.worktree_*` directories are used as accidental source roots

### B. Exclude from deployment

- `playwright-report/`
- `test-results/`
- `supabase/.temp/*`
- local note files
- ad hoc research text files
- temporary worktree folders

### C. High-impact UI/state files to inspect manually

- [App.tsx](/C:/Users/black/Desktop/memorimap/App.tsx)
- [components/AppMainLayout.tsx](/C:/Users/black/Desktop/memorimap/components/AppMainLayout.tsx)
- [components/ModalContainer.tsx](/C:/Users/black/Desktop/memorimap/components/ModalContainer.tsx)
- [components/ContentRouter.tsx](/C:/Users/black/Desktop/memorimap/components/ContentRouter.tsx)
- [components/MyPageView/index.tsx](/C:/Users/black/Desktop/memorimap/components/MyPageView/index.tsx)
- [components/AI/ChatInterface.tsx](/C:/Users/black/Desktop/memorimap/components/AI/ChatInterface.tsx)
- [components/AI/FuneralSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/FuneralSearchForm.tsx)
- [components/AI/MemorialSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/MemorialSearchForm.tsx)
- [components/AI/PetSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/PetSearchForm.tsx)
- [components/AI/RecommendList.tsx](/C:/Users/black/Desktop/memorimap/components/AI/RecommendList.tsx)

### D. Dashboard-side files that may affect reported behavior indirectly

- [components/ConsultationList.tsx](/C:/Users/black/Desktop/memorimap/components/ConsultationList.tsx)
- [components/dashboard/useFacilityAdmin.ts](/C:/Users/black/Desktop/memorimap/components/dashboard/useFacilityAdmin.ts)
- [components/dashboard/facility/ReservationManager.tsx](/C:/Users/black/Desktop/memorimap/components/dashboard/facility/ReservationManager.tsx)

### E. Build validation

- Run `npm run build`
- Record the generated `dist/assets/index-*.js`
- Record the generated `dist/assets/index-*.css`
- After deployment, fetch deployed HTML and confirm the same hashes are referenced

## Functional Verification Scenarios

The next deployment should be validated against these exact user flows.

### Scenario 1. Global AI recommendation to facility transition

Precondition:

- open global AI helper (`maum-i`)
- submit a recommendation search form
- receive recommended facility cards

Actions:

- tap a recommended facility name card

Verify:

- whether the expected UX is facility sheet opening or AI handoff
- whether the previous AI overlay closes or persists intentionally
- whether the selected facility context matches the tapped card

### Scenario 2. Global AI to My Page transition

Precondition:

- global AI helper open
- recommendation results visible or chat context active

Actions:

- use the button that routes to My Page / consultation history

Verify:

- AI overlay closes
- `ViewState.MY_PAGE` content renders alone
- no stale overlay remains on top of My Page

### Scenario 3. Facility-specific AI handoff

Precondition:

- start from a facility-specific recommendation or facility-associated AI context

Actions:

- switch from one recommended facility to another via card click

Verify:

- whether chat target changes correctly
- whether handover context updates correctly
- whether any previous facility UI remains unexpectedly mounted

### Scenario 4. Mobile layout validation

Viewport:

- narrow mobile width

Verify:

- recommended facility names show fully or at least without early 4-character truncation
- badge placement does not compress the title unexpectedly
- title wrapping does not break button hit area

### Scenario 5. Deployment parity validation

After production deployment:

- fetch deployed HTML from `memorimap.kr`
- fetch deployed HTML from `memorimap-app.vercel.app`
- compare referenced JS/CSS hashes
- compare them with the local staged build output

Pass condition:

- deployed HTML bundle references match the intended local staged build exactly

## Preliminary Candidate Files To Review Before Next Deployment

High-priority candidates:

- [components/AppMainLayout.tsx](/C:/Users/black/Desktop/memorimap/components/AppMainLayout.tsx)
- [App.tsx](/C:/Users/black/Desktop/memorimap/App.tsx)
- [components/ModalContainer.tsx](/C:/Users/black/Desktop/memorimap/components/ModalContainer.tsx)
- [components/ContentRouter.tsx](/C:/Users/black/Desktop/memorimap/components/ContentRouter.tsx)
- [components/MyPageView/index.tsx](/C:/Users/black/Desktop/memorimap/components/MyPageView/index.tsx)
- [components/ConsultationList.tsx](/C:/Users/black/Desktop/memorimap/components/ConsultationList.tsx)
- [components/dashboard/useFacilityAdmin.ts](/C:/Users/black/Desktop/memorimap/components/dashboard/useFacilityAdmin.ts)
- [components/dashboard/facility/ReservationManager.tsx](/C:/Users/black/Desktop/memorimap/components/dashboard/facility/ReservationManager.tsx)
- [components/AI/FuneralSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/FuneralSearchForm.tsx)
- [components/AI/MemorialSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/MemorialSearchForm.tsx)
- [components/AI/PetSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/PetSearchForm.tsx)
- [components/AI/RecommendList.tsx](/C:/Users/black/Desktop/memorimap/components/AI/RecommendList.tsx)
- [components/MapContainer.tsx](/C:/Users/black/Desktop/memorimap/components/MapContainer.tsx)
- [index.html](/C:/Users/black/Desktop/memorimap/index.html)

Likely exclude:

- `.stage_*` worktree folders
- `.worktree_*` folders
- `playwright-report/`
- `test-results/`
- `supabase/.temp/*`
- local notes and ad hoc research text files

## File Classification Review

This section reflects a manual review of currently modified local files.

### Include in next reviewed deployment

#### 1. Recommended facility mobile UI fixes

These files contain direct user-facing UI changes related to recommendation cards:

- [components/AI/FuneralSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/FuneralSearchForm.tsx)
- [components/AI/MemorialSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/MemorialSearchForm.tsx)
- [components/AI/PetSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/PetSearchForm.tsx)
- [components/AI/RecommendList.tsx](/C:/Users/black/Desktop/memorimap/components/AI/RecommendList.tsx)

Reason:

- direct impact on recommended card readability and mobile truncation behavior

#### 2. Naver Maps runtime loading fix

- [components/MapContainer.tsx](/C:/Users/black/Desktop/memorimap/components/MapContainer.tsx)
- [index.html](/C:/Users/black/Desktop/memorimap/index.html)

Reason:

- removes static env substitution warning path
- introduces runtime SDK loading with clearer failure behavior
- build verified locally

#### 3. Consultation admin unread-count / AI-item handling

- [components/ConsultationList.tsx](/C:/Users/black/Desktop/memorimap/components/ConsultationList.tsx)
- [components/dashboard/useFacilityAdmin.ts](/C:/Users/black/Desktop/memorimap/components/dashboard/useFacilityAdmin.ts)

Observed change:

- AI consultations are excluded from unread handling and unread count
- AI consultations show informational text instead of reply UI in admin consultation list

Reason:

- this is a coherent functional behavior change
- low risk and internally consistent between list rendering and count calculation

#### 4. Reservation manager text/filter polish

- [components/dashboard/facility/ReservationManager.tsx](/C:/Users/black/Desktop/memorimap/components/dashboard/facility/ReservationManager.tsx)

Observed change:

- pending count now includes both `pending` and `urgent`
- button labels and prompt text adjusted
- mostly wording/readability improvements plus minor count consistency fix

Reason:

- likely safe to include if deploying current facility-admin behavior as a set

### Safe to exclude from deployment

#### 1. Local tool settings

- [.claude/settings.local.json](/C:/Users/black/Desktop/memorimap/.claude/settings.local.json)

Reason:

- local editor/assistant tool configuration only
- not application runtime behavior

#### 2. TypeScript incremental build cache

- [.tsbuildinfo](/C:/Users/black/Desktop/memorimap/.tsbuildinfo)

Reason:

- generated cache artifact
- should not be part of a reviewed deployment payload

#### 3. Supabase temp/version files

- [supabase/.temp/cli-latest](/C:/Users/black/Desktop/memorimap/supabase/.temp/cli-latest)
- [supabase/.temp/gotrue-version](/C:/Users/black/Desktop/memorimap/supabase/.temp/gotrue-version)
- [supabase/.temp/storage-migration](/C:/Users/black/Desktop/memorimap/supabase/.temp/storage-migration)
- [supabase/.temp/storage-version](/C:/Users/black/Desktop/memorimap/supabase/.temp/storage-version)

Reason:

- environment-generated temp metadata
- not reliable reviewed source changes
- should be excluded from application deployment

### Currently modified but no diff detected in focused review

- [components/AppMainLayout.tsx](/C:/Users/black/Desktop/memorimap/components/AppMainLayout.tsx)

At time of review:

- file showed as modified in `git status`
- but no content diff was returned in focused `git diff`

Interpretation:

- possible line-ending or metadata-only change
- low deployment value unless later diff review shows real functional edits

Recommendation:

- exclude unless a later targeted review reveals user-facing logic changes

## Recommended Reviewed Deployment Set

Based on current evidence, the recommended reviewed deployment set is:

- [components/AI/FuneralSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/FuneralSearchForm.tsx)
- [components/AI/MemorialSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/MemorialSearchForm.tsx)
- [components/AI/PetSearchForm.tsx](/C:/Users/black/Desktop/memorimap/components/AI/PetSearchForm.tsx)
- [components/AI/RecommendList.tsx](/C:/Users/black/Desktop/memorimap/components/AI/RecommendList.tsx)
- [components/MapContainer.tsx](/C:/Users/black/Desktop/memorimap/components/MapContainer.tsx)
- [index.html](/C:/Users/black/Desktop/memorimap/index.html)
- [components/ConsultationList.tsx](/C:/Users/black/Desktop/memorimap/components/ConsultationList.tsx)
- [components/dashboard/useFacilityAdmin.ts](/C:/Users/black/Desktop/memorimap/components/dashboard/useFacilityAdmin.ts)
- [components/dashboard/facility/ReservationManager.tsx](/C:/Users/black/Desktop/memorimap/components/dashboard/facility/ReservationManager.tsx)

## Recommended Exclusion Set

- [.claude/settings.local.json](/C:/Users/black/Desktop/memorimap/.claude/settings.local.json)
- [.tsbuildinfo](/C:/Users/black/Desktop/memorimap/.tsbuildinfo)
- [supabase/.temp/cli-latest](/C:/Users/black/Desktop/memorimap/supabase/.temp/cli-latest)
- [supabase/.temp/gotrue-version](/C:/Users/black/Desktop/memorimap/supabase/.temp/gotrue-version)
- [supabase/.temp/storage-migration](/C:/Users/black/Desktop/memorimap/supabase/.temp/storage-migration)
- [supabase/.temp/storage-version](/C:/Users/black/Desktop/memorimap/supabase/.temp/storage-version)
- temporary worktrees and staging directories
- logs, reports, notes, research scratch files

## Conclusion

The production site is currently out of sync with the current local workspace.

The safest correct next move is not an immediate blind redeploy, but a reviewed staged deploy based on the current dirty workspace, because:

- the user-reported fixes likely live in uncommitted local files excluded from previous clean deployments
- the exact recommendation-card click behavior must be validated against intended UX, since current code inspection shows AI handoff behavior rather than direct sheet opening
