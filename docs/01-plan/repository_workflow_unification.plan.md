# Repository Workflow Unification Plan

Date: 2026-03-25
Project: `memorimap`
Audience: Claude, GPT, and any future coding agent working in this repository

## Goal

Unify repository operations so that multiple agents can work on the same codebase without recreating branch sprawl, worktree buildup, root-level document scatter, or deployment ambiguity.

This document defines the single operating model for this repository.

## Current Verified Baseline

Verified on 2026-03-25:

- registered worktrees: 1
- local branches: `dev`, `main`
- remote branches: `origin/main`, `origin/dev`, `origin/HEAD`
- root-level `docs/` files: 6
- local `dev`, local `main`, `origin/dev`, and `origin/main` all point to `f5dc9bd`

Important note:

- the repository is not fully clean at this moment
- current uncommitted / untracked items still exist and must not be ignored

Observed local workspace residue:

- modified: `.claude/settings.local.json`
- modified: `components/FacilityItem.tsx`
- untracked: `docs/03-analysis/repository_cleanup_precision_verification_20260325.md`
- additional untracked local directories with non-ASCII names are present in the workspace

Implication:

- cleanup structure is complete
- working tree hygiene still requires discipline

## Single Source of Truth

The repository must use the following baseline:

- development branch: `dev`
- release / deployment branch: `main`
- default active coding branch for ongoing work: `dev`

Rules:

- do not use agent-named branches such as `claude/*`, `gpt/*`, or random generated names
- do not keep long-lived experimental branches without an explicit owner and purpose
- do not treat local dirty state as deployable state

## Branch Policy

### Allowed long-lived branches

- `dev`
- `main`

### Allowed temporary branch patterns

Only create a temporary branch when the task is large enough that isolating it is materially useful.

Allowed names:

- `fix/<short-purpose>`
- `feat/<short-purpose>`
- `refactor/<short-purpose>`
- `docs/<short-purpose>`
- `release/<short-purpose>` only when a real release hardening flow is needed

Disallowed names:

- `claude/*`
- `gpt/*`
- random human-name or scientist-name branches
- `backup/*` as a long-term storage pattern

### Temporary branch lifecycle

1. branch is created for one scoped task
2. task is merged or intentionally abandoned
3. branch is deleted immediately after merge or archival

### Archival policy

If a branch contains work worth preserving but not merging now:

- create a tag under `archive/<short-purpose>`
- record the reason in a doc or worklog if needed
- delete the branch afterward

## Worktree Policy

Default rule:

- use the main workspace only

Use a worktree only when one of these is true:

- release verification requires a clean checkout
- parallel isolated testing is genuinely necessary
- a risky refactor must be separated from active work

Worktree rules:

- every worktree must have a named purpose before creation
- every worktree must map to one specific task
- every worktree must be removed immediately after task completion
- do not accumulate inactive worktrees

Mandatory cleanup after worktree use:

- `git worktree remove <path>` if the directory still exists
- `git worktree prune`

## Document Policy

All working documents must live under `docs/` in the correct area.

Allowed structure:

- `docs/01-plan/` for plans
- `docs/02-design/` for designs
- `docs/03-analysis/` for investigations and verification
- `docs/04-report/` for results, rollout notes, and completed reports

Root-level `docs/` files are reserved only for stable project reference documents such as:

- architecture map
- launch framework
- integrity checklist
- manual test checklist

Rules:

- do not create `.txt` task notes in the repository root
- do not create ad-hoc work logs outside `docs/`
- do not leave temporary analysis files unclassified

## Deployment Policy

Deployment meaning must stay explicit:

- `dev` is the integration branch
- `main` is the deployable branch

Rules:

- do not deploy from an uncommitted dirty workspace
- do not assume a deployed environment reflects uncommitted local fixes
- before deployment, confirm `main` points to the intended commit
- after deployment, record the deployed commit SHA in a report if the release is significant

## Multi-Agent Operating Rules

The repository must follow one workflow regardless of whether the operator is Claude or GPT.

Shared rules:

- both agents must read current branch and status before starting meaningful work
- both agents must prefer editing the current workspace instead of spawning extra worktrees
- both agents must store documents only under `docs/`
- both agents must not create personal naming schemes for branches or folders
- both agents must not leave temporary artifacts behind after task completion

Handoff rule:

- one agent should not continue work from another agent's temporary branch unless explicitly requested
- if handoff is needed, hand off by commit SHA or by the shared `dev` branch, not by a private branch name

## Required Start Checklist

Before starting any new task:

1. confirm current branch
2. run `git status --short --branch`
3. confirm whether the workspace is already dirty
4. decide whether the task belongs directly on `dev` or on a temporary scoped branch
5. decide whether a new document is needed and place it under the correct `docs/` folder

## Required End Checklist

Before ending any task:

1. check `git status --short --branch`
2. remove temporary worktrees if created
3. delete merged temporary branches
4. prune stale worktree registrations
5. ensure no root-level scratch files were created
6. ensure docs were stored under the correct `docs/` location

## Cleanup Guardrails

If repository cleanup is needed again in the future, the order must be:

1. inventory snapshot
2. worktree cleanup
3. merged branch cleanup
4. manual review of unmerged branches
5. docs normalization

Never do:

- mass branch deletion without merged-status verification
- worktree deletion without recording path and branch first
- docs reorganization mixed into destructive Git cleanup without a clear boundary

## Enforcement Standard

If an agent is about to:

- create a nonstandard branch
- create a new worktree without a clear reason
- save task notes outside `docs/`
- leave merged temporary branches undeleted

that agent is operating outside the repository standard and should stop and normalize the workflow first.

## Immediate Follow-Up

After this document is adopted, the next hygiene action should be:

1. review and resolve current modified / untracked residue
2. keep all new work on `dev` unless isolation is necessary
3. use this document as the default repository workflow reference for both Claude and GPT
