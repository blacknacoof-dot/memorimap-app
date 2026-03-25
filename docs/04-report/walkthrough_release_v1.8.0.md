# Release Walkthrough: v1.8.0-RC1 (2026-02-02)

## 📌 Release Summary
This release focuses on system stability, performance verification, and safe rollout execution.

**Key Achievements:**
1.  **Performance Verification**: Confirmed `search_facilities_v2` executes in **~1.8ms** (no need for new RPC).
2.  **Image Optimization**: Implemented `OptimizedImage` component with **Feature Flag** (Safe Release).
3.  **Security Hardening**: Applied cache/security headers in `vercel.json`.
4.  **Deployment Fix**: Solved Vercel 100MB limit issue by adding `.vercelignore`.

---

## ✅ Feature Implementation

### 1. search_facilities_v2 Optimization
- **Status**: Verified & Retained
- **Performance**: 1.867ms (Excellent)
- **Fix**: Corrected column mismatch (`lat` -> `latitude`)
- **Decision**: `nearby_facilities` RPC creation **HELD**.

### 2. OptimizedImage Component
- **Path**: `components/ui/OptimizedImage.tsx`
- **Feature Flag**: `SUPABASE_IMAGE_TRANSFORM_ENABLED` (Default: `false`)
- **Usage**: Applied to Facility List thumbnails.

### 3. Vercel Configuration
- **Security Headers**: X-Frame-Options, X-Content-Type-Options
- **Caching**: `Cache-Control: public, max-age=31536000` for assets
- **Deployment**: Added `.vercelignore` to exclude `data/`, `backups/`, `*.csv` (Saved >500MB upload size).

---

## 🔍 Verification Results

### Pre-Deployment Checklist
- [x] RPC Column Name Fix
- [x] EXPLAIN ANALYZE (1.8ms)
- [x] Feature Flag Defaults Check (OFF)
- [x] Alias Consistency Check

### Deployment Status
- **Target environment**: Production
- **URL**: https://memorimap-app.vercel.app/
- **Status**: ✅ **Success**
- **Git Tag**: `release-v1.8.0-RC1`

---

## 📸 Proof of Work

> [!NOTE]
> Detailed performance logs are available in [docs/03-analysis/search_facilities_v2_performance.log.md](docs/03-analysis/search_facilities_v2_performance.log.md).

```bash
# Deployment Log
Vercel CLI 48.0.0
Retrieving project…
Deploying ptys-projects/memorimap-app
Uploading [####################] 485.0B/485.0B
Production: https://memorimap-app.vercel.app/
```
