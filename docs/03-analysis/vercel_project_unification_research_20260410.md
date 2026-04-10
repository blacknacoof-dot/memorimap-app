# Vercel Project Unification Research 2026-04-10

## Scope

This note investigates why an extra Vercel project was created during production deployment and defines the operating model that prevents recurrence.

## Verified Findings

### 1. The intended production project is singular

Verified root Vercel linkage:

- root `.vercel/project.json` points to project `memorimap-app`
- production domain `https://memorimap.kr` aliases the `memorimap-app` deployment

### 2. An unintended Vercel project was created in this session

Verified in `vercel project ls`:

- intended project: `memorimap-app`
- unintended new project: `head-e1c966c-clean`

This happened because `vercel --prod --yes` was first executed from a clean snapshot directory whose `.vercel/project.json` had already been relinked by Vercel CLI to a new local project.

### 3. Existing repository policy was partially correct but incomplete in practice

Already present before this incident:

- `docs/01-plan/repository_workflow_unification.plan.md`
- `scripts/prepare_deploy_worktree.ps1`

The script already copies root `.vercel/project.json` into a clean worktree and validates `projectName`.

The failure happened because the actual deployment bypassed that guarded path and used an ad-hoc snapshot directory instead.

### 4. Current GitHub workflow had a second policy mismatch

Verified in `.github/workflows/deploy.yml` before correction:

- web deployment used fixed `VERCEL_PROJECT_ID`
- but the same workflow also attempted `supabase db push` on `main`

This conflicted with the documented production database rule:

- production Supabase SQL is applied through Dashboard SQL Editor only
- `supabase db push` must not be used for production migrations in this project

## Root Cause

The immediate root cause was not Vercel itself. It was deployment path drift.

Sequence:

1. clean snapshot was created outside the normal guarded worktree path
2. Vercel CLI ran from that directory
3. that directory was not safely locked to the intended project
4. Vercel created a new project instead of deploying to `memorimap-app`

## Stable Operating Model

### Default production path

- commit to `main`
- push to `origin/main`
- GitHub Actions deploys to Vercel using fixed `VERCEL_PROJECT_ID`

This is the preferred path because the target project is pinned by id, not inferred from the local folder.

### Manual exception path

Manual production deploys are allowed only for emergency hotfixes or verification cases where the operator must bypass the normal CI path.

Required path:

- run `scripts/prepare_deploy_worktree.ps1 -Ref <commit> -Deploy` from repo root
- deploy only from the generated `.worktree_*` path
- never deploy from `.codex-deploy`, `.stage_*`, archive extracts, or arbitrary folders

### Post-deploy verification

After any manual deploy:

- run `vercel inspect <deployment-url>`
- confirm aliases include `memorimap.kr`
- run `vercel project ls`
- confirm no new unintended project name was created

## Corrections Applied

### 1. Workflow correction

`.github/workflows/deploy.yml` was updated so that:

- Vercel production deploy remains automated on `main`
- automatic `supabase db push` was removed

This aligns CI with the documented production database policy.

### 2. Repository policy correction

`docs/01-plan/repository_workflow_unification.plan.md` was updated to state:

- primary path is `push to main`
- arbitrary-folder `vercel --prod` is forbidden
- manual production deploys must use `scripts/prepare_deploy_worktree.ps1`
- post-deploy alias and project-list verification is mandatory

## Remaining Cleanup

Vercel project inventory still contains non-production helper projects, including:

- `head-e1c966c-clean`
- `.worktree_deploy_clean`
- `.worktree_deploy_today`
- `.worktree_pg_review_deploy`
- `.worktree_release_local_parity`
- `memorimap-release-check`

These do not currently own `memorimap.kr`, but they violate the intended project unification standard and should be reviewed for removal.

## Final Rule

For this repository:

- one production web project: `memorimap-app`
- one production domain: `memorimap.kr`
- one default deploy path: push `main` and let GitHub Actions deploy

Any Vercel production deploy that depends on the CLI inferring project identity from an arbitrary local folder is outside the standard and should be treated as a process failure.
