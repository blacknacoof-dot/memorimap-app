# Memorimap

Memorimap is a Vite + React application for memorial facility discovery, reservations, partner administration, and subscription billing. The app uses Supabase for auth/data/edge functions, map provider keys for location features, and PortOne for payment flows.

## BKIT Integration

This repository keeps BKIT tooling in `tools/bkit` as a git submodule. BKIT is part of the development workflow and is not bundled into the runtime app.

## Release Docs

- Latest security patch status: `docs/04-report/release_security_patch_status_20260330.md`
- Latest final security addendum: `docs/04-report/release_security_final_addendum_20260330.md`

## Prerequisites

- Node.js `20.19+`
- npm
- A configured Supabase project
- Map provider credentials for local map features
- PortOne keys for payment and billing test flows

## Local Setup

1. Install dependencies:
   `npm install`
2. Copy `.env.local.template` to `.env.local`.
3. Fill in the required client-side values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_NAVER_MAP_CLIENT_ID`
   - `VITE_KAKAO_REST_API_KEY`
   - `VITE_PORTONE_STORE_ID`
   - `VITE_PORTONE_CHANNEL_KEY`
   - `VITE_PORTONE_BILLING_CHANNEL_KEY`
4. Fill in the optional server-side local helpers if you run related flows:
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PORTONE_API_SECRET`
   - Supabase Edge Function secrets documented in `.env.local.template`
5. Start the dev server:
   `npm run dev`

## Validation

- Type check: `npm run typecheck`
- Lint: `npm run lint:errors`
- Build: `npm run build`
- Full local verification: `npm run verify`
- Security contract tests: `npx vitest run --reporter=dot tests/security/edgeContracts.spec.ts tests/security/cardReviewContracts.spec.ts`

## Notes

- Playwright and high-risk E2E flows require real environment credentials and seeded test data.
- Payment verification and recurring billing depend on Supabase Edge Functions and PortOne server-side secrets being configured.
