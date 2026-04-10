# Deployment Precision Verification 2026-04-08

## Scope

This report verifies the 2026-04-08 production release after the storage hardening follow-up.

Production domain:

- `https://memorimap.kr`

Release commit under verification:

- `0fbbc55a40002cfe057f8d7d4429343a17d0df6a`
- `fix: harden private storage bucket listing`

## Git State

Verified after push:

- local `HEAD`: `0fbbc55a40002cfe057f8d7d4429343a17d0df6a`
- `origin/main`: `0fbbc55a40002cfe057f8d7d4429343a17d0df6a`
- `main` and `origin/main` are aligned.

Today's relevant commit sequence:

- `0fbbc55` - harden private storage bucket listing
- `f10d72d` - remove `memorimap.com` production references
- `ebad0b1` through `54d7d7c` - release RLS audit notes
- `ac8e97c` - PortOne webhook verification notes

## Database Migration Verification

Migration file:

- `supabase/migrations/20260408072000_harden_storage_private_bucket_listing.sql`

The SQL changes are:

- set `review-images` and `partner_docs` buckets to private
- remove old public select/upload storage policies
- recreate authenticated `review-images` select/upload policies
- recreate authenticated `partner_docs` upload policy scoped to `licenses/{auth.uid()}/...`
- recreate `partner_docs` select policy for super admins only
- keep `facility-images` public

Production execution policy:

- Supabase production migrations are applied through Supabase Dashboard SQL Editor only.
- `npx supabase db push` is not used for production migrations in this project.
- This rule was added to `docs/01-plan/repository_workflow_unification.plan.md`.

Dashboard evidence supplied by the operator confirmed these policies exist in production:

- `Authenticated Select review-images`
- `Authenticated Upload review-images`
- `Authenticated Upload partner_docs`
- `Super Admin Select partner_docs`

Interpretation:

- The policy shape matches the migration file.
- The previous live finding, anon object metadata listing for private storage buckets, should be mitigated by removing public storage policies and making the private buckets non-public.

Final bucket visibility check:

- The policy query was confirmed.
- The bucket `public` flag query was confirmed:

```sql
select id, public
from storage.buckets
where id in ('review-images', 'partner_docs', 'facility-images');
```

Confirmed result:

- `review-images`: `false`
- `partner_docs`: `false`
- `facility-images`: `true`

## Deployment Verification

Vercel production deployment:

- deployment URL: `https://memorimap-l44t58kpg-ptys-projects.vercel.app`
- deployment id: `dpl_4y8oR29TGnwLhfUZ2FtXiSbQCJ1F`
- created: `2026-04-08 22:20:20 KST`
- status: `Ready`

Alias verification:

- `https://memorimap.kr` points to `https://memorimap-l44t58kpg-ptys-projects.vercel.app`

Live HTTP checks:

- `https://memorimap.kr/`: `200 OK`
- `https://memorimap.kr/robots.txt`: `200 OK`
- `https://memorimap.kr/sitemap.xml`: `200 OK`

Domain metadata checks:

- live `robots.txt` does not contain `memorimap.com`
- live `sitemap.xml` does not contain `memorimap.com`
- live `robots.txt` points to `https://memorimap.kr/sitemap.xml`
- live sitemap URLs start with `https://memorimap.kr/...`

## Build Verification

Post-deploy local verification:

- `npm run verify`: passed
- `tsc --noEmit`: passed
- `eslint --quiet`: passed
- `vite build`: passed

Observed warning:

- Vite emitted two Supabase package export warnings during the local build.
- The build still exited successfully.
- This warning was not introduced by the storage migration itself.

## Deployment Method Note

The deployment was intentionally run from a clean `git archive HEAD` snapshot rather than from the dirty working tree.

Reason:

- The main workspace had unrelated uncommitted files.
- Deploying directly from the dirty workspace could have uploaded uncommitted changes.

Consequence:

- The Vercel deployment has no useful Git metadata in `deployment.meta`.
- Commit attribution must be tracked through the verified procedure:
  - `HEAD` and `origin/main` were confirmed at `0fbbc55`
  - the clean snapshot was created from that `HEAD`
  - the Vercel production deploy was run from that snapshot

## Current Workspace Residue

The repository still has uncommitted local changes unrelated to the deployed release:

- `docs/01-plan/repository_workflow_unification.plan.md` updated with the Dashboard-only migration rule
- Supabase `.temp` version files changed
- `utils/facilityNormalizer.ts` appears modified only through line-ending state
- untracked `docs/04-report/screenshots/`
- untracked `docs/security/rls-policy.md`
- untracked empty `docs/audit_fix_plan_phase5_20260314.md`

These were not included in the clean snapshot deployment.

## Conclusion

Release status:

- `main` and `origin/main` are aligned at `0fbbc55`.
- `memorimap.kr` points to the new Vercel production deployment.
- live root, robots, and sitemap checks pass.
- `memorimap.com` production metadata residue is not present in live robots or sitemap.
- storage policy production state matches the hardening migration according to the Dashboard policy query supplied by the operator.

Residual risk:

- Supabase migration history remains out of sync because production SQL is applied manually through Dashboard.
- This is an accepted project operating model, but future `npx supabase db push` must be avoided unless a separate migration history repair task is performed.
- The final bucket `public` flag check should be retained as an explicit DB verification step whenever storage policy work is touched.
