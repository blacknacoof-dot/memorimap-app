# Repository Cleanup Precision Verification

Date: 2026-03-25
Project: `memorimap`
Author: Codex

## Summary

This document verifies the proposed repository cleanup plan against the actual local Git state on 2026-03-25.

Conclusion:

- the cleanup direction is valid
- the current plan is too aggressive for branch deletion
- worktree cleanup can start immediately, but branch cleanup must be split into `safe delete` and `hold`
- `docs/` reorganization should be done in a separate commit after Git structure cleanup

The key correction is:

`inventory -> prune/remove worktrees -> verify merged status -> delete only safe branches -> move docs`

## Scope

This verification covers:

- registered Git worktrees
- local and remote branch inventory
- merged / unmerged branch status relative to `main` and `dev`
- root-level `docs/` file sprawl
- risks in the proposed A / B / C / D cleanup sequence

This document does not execute cleanup. It only validates the plan and defines a safer execution order.

## Evidence Collected

### 1. Current primary branches

- local `HEAD`: `dev`
- local `main`: present
- current local `dev` and local `main` both point to `15f9151`
- `origin/main` points to `15f9151`
- `origin/dev` points to `0fc0354`

Implication:

- local `main` and local `dev` are currently aligned
- `origin/dev` is behind local `dev`
- cleanup must not assume remote parity across all branches

### 2. Registered worktrees

Observed via `git worktree list --porcelain`:

- main workspace: 1
- Claude worktrees under `.claude/worktrees`: 17
- prunable stage/release worktree registrations: 7
- external worktree: `C:\Users\black\Desktop\memorimap-release-check`

Important details:

- `.claude/worktrees` directory still exists and is approximately `998,633,237` bytes
- `C:\Users\black\Desktop\memorimap-release-check` still exists and is approximately `346,879,730` bytes
- the 7 stage/release entries are already `prunable` because the registered gitdir target no longer exists

Result:

- the claim that old GPT stage/worktree directories were deleted but Git registrations remain is correct
- the claim that Claude worktrees still consume significant local disk is also correct

### 3. Local branch inventory

Observed local branches: 28

Branches currently checked or referenced by worktrees:

- `dev`
- `claude/*` branches tied to `.claude/worktrees`
- `release-de27efa-check`
- `release/local-parity-merge`
- `release/payment-main`

### 4. Remote branch inventory

Observed remote refs under `origin/*`: 12 branch refs plus `origin/HEAD`

Remote branches currently present:

- `origin/main`
- `origin/dev`
- `origin/release-de27efa-check`
- `origin/backup-ai-restore-point`
- `origin/backup/before-phase3`
- `origin/feat/zustand-migration`
- `origin/feature/error-handling-safe`
- `origin/claude/exciting-ellis`
- `origin/claude/kind-brown`
- `origin/claude/priceless-feistel`
- `origin/claude/sad-saha`
- `origin/claude/zealous-agnesi`
- `origin/claude/zen-tu`

### 5. Root-level docs sprawl

Observed direct files under `docs/`: 25

Breakdown:

- `.md`: 19
- `.txt`: 6

Implication:

- the user's count of "25 scattered docs files" is accurate for root-level files under `docs/`
- the structural problem is real and measurable

## Precision Findings

### Finding 1. Worktree cleanup is safe to start immediately

Safe immediate actions:

- `git worktree prune`
- remove `.claude/worktrees/*` registrations after confirming no needed uncommitted work exists there
- remove external `memorimap-release-check` worktree if no longer needed

Why this is safe:

- 7 entries are already marked `prunable`
- most Claude worktrees point at older feature branches and are clearly auxiliary workspaces

What still must be recorded first:

- worktree path
- branch name or detached HEAD
- current commit SHA

Reason:

- once removed, mapping between branch and workspace becomes less obvious
- the cleanup should leave an audit trail

### Finding 2. The branch-deletion section in the proposed plan is not yet safe as written

The proposed statement "keep only `dev`, `main` and delete the rest" is not fully supported by current evidence.

Observed local branches not merged into either `main` or `dev`:

- `claude/exciting-ellis`
- `claude/recursing-yonath`
- `claude/strange-davinci`
- `claude/zealous-yonath`
- `feature/error-handling-safe`
- `refactor/mobile-layout`

Implication:

- these branches cannot be treated as automatically disposable
- deleting them without inspection could remove unmerged work

Observed local branches already merged into both `main` and `dev`:

- `backup-ai-restore-point`
- `backup/before-phase3`
- `claude/cool-meitner`
- `claude/crazy-bhabha`
- `claude/dazzling-shockley`
- `claude/dreamy-bartik`
- `claude/festive-brahmagupta`
- `claude/interesting-darwin`
- `claude/laughing-galileo`
- `claude/magical-margulis`
- `claude/mystifying-easley`
- `claude/naughty-kalam`
- `claude/objective-hugle`
- `claude/recursing-ishizaka`
- `claude/trusting-payne`
- `claude/unruffled-wilson`
- `feat/zustand-migration`
- `release-de27efa-check`
- `release/local-parity-merge`
- `release/payment-main`

Implication:

- these are strong candidates for safe deletion after branch-to-purpose review
- `backup/*` branches should still be tagged before deletion if they are intended as restore anchors

### Finding 3. Some remote branches are cleanup candidates, but some require separate verification

Likely safe remote cleanup candidates:

- stale `origin/claude/*` branches
- `origin/release-de27efa-check`

Remote branches that should not be deleted by default:

- `origin/main`
- `origin/dev`

Remote branches that should be verified before deletion because they are not clearly superseded from current local evidence alone:

- `origin/backup-ai-restore-point`
- `origin/backup/before-phase3`
- `origin/feat/zustand-migration`
- `origin/feature/error-handling-safe`

Reason:

- some of these correspond to local branches with unmerged status or archival intent

### Finding 4. `docs/` reorganization is valid, but should not be mixed with Git structure deletion

The target folder structure is reasonable:

- `docs/01-plan`
- `docs/02-design`
- `docs/03-analysis`
- `docs/04-report`

However, this should be a separate change from worktree/branch cleanup because:

- file moves create large diffs
- cleanup and documentation migration have different rollback needs
- mixing both makes review and blame tracking worse

### Finding 5. Current repository status is already dirty

Observed from `git status --short`:

- modified: `.claude/settings.local.json`
- untracked documentation files already exist under `docs/`
- additional untracked directories with non-ASCII names exist in the workspace

Implication:

- cleanup work must avoid broad destructive commands
- document moves and Git branch cleanup should not be done blindly in one pass

## Validation of Proposed Plan

### A. Git Worktree Cleanup

Assessment: valid, with minor safeguards required.

Recommended execution:

1. export inventory of all worktrees with path, branch, and SHA
2. run `git worktree prune`
3. remove obsolete `.claude/worktrees/*`
4. remove external `memorimap-release-check` if confirmed unused

### B. Branch Cleanup

Assessment: partially valid, but current deletion scope is too broad.

Recommended split:

- Safe delete candidates:
  - merged `claude/*`
  - merged `release/*`
  - merged `feat/*`
  - merged backup branches only after tags are created
- Hold candidates:
  - `claude/exciting-ellis`
  - `claude/recursing-yonath`
  - `claude/strange-davinci`
  - `claude/zealous-yonath`
  - `feature/error-handling-safe`
  - `refactor/mobile-layout`

Required rule:

- do not delete any branch that is not merged into either `main` or `dev` without explicit content review

### C. `docs/` Folder Reorganization

Assessment: valid, but should happen after A and the safe subset of B.

Recommended rule:

- treat this as a dedicated docs-only cleanup commit

### D. Recurrence Prevention

Assessment: valid.

Recommended additions:

- define a mandatory post-task worktree cleanup checklist
- require any temporary workspace branch to include owner + date or task id
- require branch and worktree inventory before mass cleanup

## Recommended Execution Order

### Phase 0. Snapshot

Create a text snapshot before deletion:

- `git worktree list --porcelain`
- `git branch -a`
- `git for-each-ref --format=...`

### Phase 1. Worktree cleanup

- prune prunable entries
- remove obsolete local Claude worktrees
- remove obsolete external release-check worktree

### Phase 2. Safe branch cleanup

- tag backup branches if they must remain recoverable
- delete only branches already merged into `main` and `dev`

### Phase 3. Hold review

Manually review the unmerged set:

- `claude/exciting-ellis`
- `claude/recursing-yonath`
- `claude/strange-davinci`
- `claude/zealous-yonath`
- `feature/error-handling-safe`
- `refactor/mobile-layout`

Only after review:

- merge
- archive by tag
- or delete

### Phase 4. Docs reorganization

- move root-level docs into the agreed folder structure
- keep stable top-level operational documents in place only if intentionally designated

### Phase 5. Guardrails

- confirm `.gitignore` coverage
- add cleanup procedure note to team memory / workflow doc

## Final Recommendation

The proposed cleanup is directionally correct, but should not be approved in its current "delete first" form.

What is supported by evidence:

- worktree cleanup should proceed
- prunable registrations should be pruned
- root `docs/` sprawl should be normalized
- many old Claude and release branches are safe cleanup candidates

What is not yet supported by evidence:

- deleting all non-`main` / non-`dev` branches
- treating every `claude/*`, `feature/*`, or `refactor/*` branch as already integrated

Operationally correct approval wording:

`Proceed with inventory snapshot first, then worktree cleanup, then merged-branch cleanup only. Hold unmerged branches for manual review. Perform docs reorganization in a separate commit after Git cleanup.`
