# Deployment Chunk/Cache Verification Checklist

## Purpose

This checklist is for production deploy verification where stale HTML, cached lazy chunks, and asset fallback behavior can break the running app even when the feature itself is correct.

It is separate from normal feature QA.

## Current Memorimap Risk Profile

- Router: `HashRouter`
- Lazy routes/components: heavy `React.lazy()` usage in [components/ContentRouter.tsx](/C:/Users/black/Desktop/memorimap/components/ContentRouter.tsx)
- Asset hosting: Vercel
- Asset fallback hardening: `/assets/*` should return `404`, not `index.html`
- Service worker: not currently detected in the codebase

## Highest Priority Scenarios

### 1. Old Tab Kept Open During Deploy

Steps:
1. Open current production site.
2. Keep the tab open.
3. Deploy a new version.
4. Without hard refresh, navigate to a lazy page.

Recommended routes:
- `/#/super-admin`
- `/#/settings`
- `/#/personal-subscription`

Expected:
- No white screen
- No `ChunkLoadError`
- No `Failed to load module script`
- No MIME `text/html` errors for JS/CSS assets

### 2. Lazy Chunk Route After Deploy

Steps:
1. Open the home page only.
2. Do not open the admin or settings screens yet.
3. Deploy a new version.
4. Navigate to a lazy-loaded route.

Expected:
- Dynamic import resolves correctly
- No `404` for active chunk files
- No asset fallback to `index.html`

### 3. Cache-Preserved Routing Test

Steps:
1. Open the site with DevTools cache left enabled.
2. Navigate through several pages.
3. Deploy a new version.
4. Move between routes without hard refresh.

Expected:
- Router still works
- Newly requested lazy chunks load
- No stale shell breakage

## Additional Recommended Scenarios

### 4. Back/Forward Navigation After Deploy

Steps:
1. Open several routes.
2. Deploy.
3. Use browser back/forward.

Expected:
- No broken route shell
- No chunk import failure

### 5. Old Session + Deploy

Steps:
1. Stay logged in.
2. Leave the tab idle for a while.
3. Deploy.
4. Resume usage.

Expected:
- App shell loads
- Auth restore completes
- No cascading `401` caused by broken chunk loading

### 6. Multi-Browser / Device Check

Steps:
1. Test immediately after deploy on multiple browsers or devices.
2. Include at least one mobile browser.

Expected:
- No user-specific stale asset failures
- No CDN edge mismatch symptoms

### 7. Asset Fallback Test

Steps:
1. Directly request a fake asset.

Examples:
- `/assets/fake.js`
- `/assets/fake.css`

Expected:
- `404 Not Found`

Not acceptable:
- `index.html`
- MIME mismatch caused by HTML returned for script/style request

## Post-Deploy Smoke Checks

Immediately after deploy:
1. Open home page
2. Log in
3. Visit one lazy admin page
4. Visit one lazy user page
5. Confirm API calls succeed
6. Confirm auth restore succeeds after refresh
7. Confirm fake asset path returns `404`

## Current Defensive Control

Memorimap now includes one-time chunk recovery logic at app bootstrap:
- File: [chunkRecovery.ts](/C:/Users/black/Desktop/memorimap/lib/chunkRecovery.ts)
- Entry: [index.tsx](/C:/Users/black/Desktop/memorimap/index.tsx)

Behavior:
- Detect common lazy chunk failures
- Attempt one automatic reload
- Prevent infinite reload loops via `sessionStorage`

## Recommended Operational Commands

```powershell
curl.exe -I https://memorimap.kr
curl.exe -I https://memorimap.kr/assets/fake.js
```

Expected:
- Root responds normally
- Fake asset returns `404 Not Found`

## Release Gate Recommendation

For deployment-sensitive releases, do at least these three checks:
1. Old tab kept open during deploy
2. Lazy route first entry after deploy
3. Cache-preserved route transition after deploy

These three catch most stale chunk and asset-fallback failures before users report them.
