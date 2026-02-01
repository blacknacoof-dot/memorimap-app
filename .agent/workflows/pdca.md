---
description: Run a systematic PDCA (Plan-Do-Check-Act) cycle for code improvements
---

# PDCA Workflow

This workflow guides the agent through a rigorous Plan-Do-Check-Act cycle to ensure high-quality code implementation and verification.

## 1. PLAN (기획 및 설계)
- **Goal**: Understand the requirements and design the solution.
- **Steps**:
  - Analyze the target files and current codebase state.
  - Identify potential risks, dependencies, and necessary changes.
  - Create or update `implementation_plan.md`.
  - **Critical**: Do NOT proceed to execution until the plan is approved (if complex) or clear.

## 2. DO (실행)
- **Goal**: Implement the changes according to the plan.
- **Steps**:
  - Execute code edits using `replace_file_content` or `write_to_file`.
  - Follow the `implementation_plan.md` strictly.
  - Fix any immediate syntax errors or type mismatches.

## 3. CHECK (검증)
- **Goal**: Verify the changes work as expected.
- **Steps**:
  - Run `verify_implementation` workflow if available.
  - Perform manual verification steps (e.g., checking UI, running a simulated flow).
  - Verify that no regressions were introduced.
  - Update `walkthrough.md` with proof of verification (screenshots/logs).

## 4. ACT (개선 및 반영)
- **Goal**: Standardize and finalize.
- **Steps**:
  - If verification fails, loop back to PLAN or DO.
  - Refactor code if necessary for cleanliness.
  - Update `task.md` to mark items as complete.
  - Commit logic (if logical unit is complete).
