# Repository And Deploy State Audit 2026-04-13

Date: 2026-04-13
Workspace: `C:\Users\black\Desktop\memorimap`
Branch: `main`

## Scope

This audit verifies whether the repository's current commit, `local-only`, `committed-local`, `remote-only`, and deployment state are being managed in a planned way.

Checked areas:

- local git branch state
- committed but unpushed work
- modified and untracked local files
- production deployment alignment
- deploy inclusion and exclusion rules

## Git State Summary

Current branch state:

- local branch: `main`
- upstream: `origin/main`
- local branch status: ahead by 3 commits
- local working tree: dirty

Current local modified files:

- `CLAUDE.md`
- `docs/01-plan/repository_workflow_unification.plan.md`
- `system.md`

Current untracked files:

- `docs/04-report/e2e_priority_run_20260410.md`
- `docs/04-report/screenshots/business-info-footer.png`
- `docs/04-report/screenshots/product-detail-basic.png`
- `docs/04-report/screenshots/product-list-prices.png`
- `docs/04-report/screenshots/refund-policy.png`
- `docs/POST_DEPLOY_TEST_RUNBOOK.md`
- `docs/audit_fix_plan_phase5_20260314.md`
- `docs/marketing/goyang_funeral_db_seed_20260411.md`
- `docs/marketing/goyang_funeral_landing_draft_20260411.md`
- `docs/marketing/goyang_marketing_research_20260411.md`
- `docs/marketing/myeongji_funeral_detail_draft_20260411.md`

Interpretation:

- The repository is not in a release-ready state because the working tree is not clean.
- The local-only residue is document-heavy and not application-code-heavy.
- The local state is understandable, but it still requires explicit sorting before the next patch or deploy.

## Ahead-Of-Origin Commits

Local `HEAD` is ahead of `origin/main` by these 3 commits:

1. `547a4f9` - `docs: add deployment and security runbooks`
2. `900bd49` - `docs: add map marker cluster research report`
3. `15fcfb1` - `docs: add marketing and sales planning reports`

Observed property:

- all 3 ahead commits are documentation-only commits
- no non-`docs/` file differs between `origin/main` and local `HEAD`

Interpretation:

- These commits do not represent pending production code changes.
- They should stay separate from future patch or release commits unless a task explicitly asks to reorganize them.

## Local Modified Files

Current modified but uncommitted files:

- `CLAUDE.md`
- `docs/01-plan/repository_workflow_unification.plan.md`
- `system.md`

Their current edits add workflow rules that say:

- review whether document-only changes should stay separate before commit or deploy
- preserve the 2026-04-10 documentation split
- keep the three 2026-04-10 document commits separate from routine patch or deploy work
- keep `docs/04-report/screenshots/` and `docs/audit_fix_plan_phase5_20260314.md` out of routine deploy or patch commits unless explicitly requested

Interpretation:

- These are process-governance edits, not release-code edits.
- They are valid as policy notes, but they are still loose local changes and can be mixed into unrelated work by accident if left uncommitted.

## Local Untracked Files

All currently untracked files are under `docs/`.

Interpretation:

- The untracked files are being kept outside the release path in practice.
- They still need an explicit disposition:
  - commit as documentation
  - hold locally on purpose
  - remove if obsolete

## Deployment Alignment

Production domain checked:

- `https://memorimap.kr`

Current production deployment from Vercel inspect:

- deployment URL: `https://memorimap-dh1keci74-ptys-projects.vercel.app`
- target: `production`
- status: `Ready`
- created: `2026-04-10 11:23:17 KST`

Relevant local and remote commit times:

- `c21bc15` `fix: recover stale chunk sessions after deploy` at `2026-04-10 15:59:18 KST`
- `547a4f9` at `2026-04-10 20:14:45 KST`
- `900bd49` at `2026-04-10 20:17:15 KST`
- `15fcfb1` at `2026-04-10 20:19:22 KST`

Interpretation:

- current production is older than remote `origin/main`
- production therefore does not include at least `c21bc15`
- local ahead document commits are also not deployed, but they are not release-code commits

Operational status:

- deployed production: behind current remote mainline
- remote code: ahead of production
- local docs: ahead of remote

## Deploy Inclusion And Exclusion Rules

Relevant deploy filter from `.vercelignore`:

- `docs/`
- `tools/`
- `scripts/`
- `cypress/`
- `tests/`
- `test-results/`
- `playwright-report/`

Relevant git ignore rules:

- `.env.local` is ignored
- `.env.local.template` is allowed to be tracked

Interpretation:

- the current untracked `docs/` files are not part of Vercel production deployments
- local `.env.local` is being handled as a local-only file as intended
- documentation residue does not directly threaten deployment contents, but it does threaten workflow clarity if commit boundaries are not maintained

## Plannedness Assessment

Assessment by category:

- commit separation: mostly planned
- `local-only` separation: partially planned
- deployment separation: planned in configuration
- release execution discipline: currently incomplete

Reasoning:

- The repository already has explicit rules that release work should not be deployed from a dirty tree and that document-only work should remain separate.
- The ignore configuration supports that separation.
- The current state still has unresolved local edits and untracked documentation, so the plan exists but execution is not fully closed.
- Production is behind remote mainline, so deploy discipline is not currently caught up with code state.

## Recommended Next Sequence

Use this order for the next cleanup:

1. Decide whether the 3 modified workflow files should be committed now as one documentation-policy commit or kept local temporarily.
2. Decide which untracked `docs/` files are intentional keepers and which are temporary hold items.
3. Keep the 2026-04-10 document commits separate from any application patch or release commit.
4. Before any production deploy, ensure the worktree used for deploy is clean and points to the intended Git commit.
5. If the intention is to bring production up to date with remote code, deploy from a clean tree that includes `c21bc15` or a newer explicitly chosen commit.
6. After deploy, record the deployed commit SHA and Vercel deployment URL in a release report.

## Immediate Conclusion

The repository is not chaotic, but it is not fully closed-loop either.

The current state is best described as:

- commit boundaries are conceptually well-defined
- documentation and deploy artifacts are mostly separated correctly
- production is lagging behind remote code
- local document residue still needs an explicit keep, commit, or hold decision before the next operational release step
