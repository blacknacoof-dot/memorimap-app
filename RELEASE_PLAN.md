# 🚀 Pre-Release & Deployment Plan (v1.0)

> **Target Release**: Gemini-Claude Collaborative Update
> **Status**: Code Implementation Complete | **Current Phase**: Final Verification & Deployment

---

## 1. 📋 Status Overview

All planned critical updates for the "AI Search Simplification" and "Phase 4 Refactoring" have been implemented.

### ✅ Completed Tables
| Feature / Task | Priority | Status | Description |
|----------------|----------|--------|-------------|
| **AI Smart Search** | P0 | **Done** | Unified search for Funeral/Memorial/Pet |
| **GPS Fallback** | P0 | **Done** | Manual region selection modal on GPS error |
| **Pet Reservation** | P0 | **Done** | Direct reservation flow for pet funerals |
| **Refactoring** | P0 | **Done** | `App.tsx` modularization (<400 lines), Hooks extraction |
| **UX Improve** | P1 | **Done** | Korean IME composition, Mobile z-index adjustments |
| **Performance** | P2 | **Done** | Lazy loading, Search history (localStorage) |

---

## 2. 🔍 Final Verification Checklist

Before deploying to production, perform the following verifications on the **Staging** environment.

### 2-1. Critical User Flows (Functional)
- [ ] **Funeral/Memorial Search**
    - [ ] Enter "Gangnam" -> Select filters -> Verify 3 recommendations appear.
    - [ ] Click facility -> Confirm ChatInterface opens with correct context.
- [ ] **Pet Funeral Search**
    - [ ] Click "Pet Funeral" -> Select Region -> Verify facility list.
    - [ ] Select facility -> Fill Reservation Form -> Submit -> Verify Success Modal.
- [ ] **GPS Fallback**
    - [ ] Block Location Access in browser -> Click "Current Location" -> Verify Modal appears -> Select Region manually -> Search proceeds.
- [ ] **Admin Dashboard**
    - [ ] Login as Super Admin -> Verify Layout (TopBar/BottomNav) renders correctly.
    - [ ] Check "Consultations" tab -> Verify new inquiries data.

### 2-2. Cross-Device & Browser
- [ ] **Mobile (iOS Safari)**: Check BottomNav visibility, Dropdown z-index, Touch interactions.
- [ ] **Mobile (Android Chrome)**: Check Keyboard covering inputs, Back button behavior.
- [ ] **Desktop (Chrome/Edge)**: Check Layout stability, Map rendering.

### 2-3. Performance & Security
- [ ] **Lighthouse Score**: Performance > 90 (Mobile).
- [ ] **Bundle Size**: Verify no unexpected spike in vendor.js.
- [ ] **Security**: Verify `anon` key is NOT used for sensitive writes (Consultation/Reservation).

---

## 3. 🚀 Deployment Strategy

### Phase 1: Staging Deployment (Internal)
1.  **Build**: `npm run build` (Ensure no TS errors).
2.  **Deploy**: Deploy to Vercel Preview / Staging Server.
3.  **Sanity Check**: Run `2-1. Critical User Flows` manually.

### Phase 2: Production Release
1.  **Backup**: Export current Database (Supabase) snapshot (Just in case).
2.  **Promote**: Promote Staging build to Production.
3.  **Monitor**: Watch logs for 500 errors or Client-side exceptions (Sentry/Logs).

---

## 4. ↩️ Rollback Plan

In case of critical failure (e.g., White Screen of Death, Broken Core Main Flow):

1.  **Immediate Action**: Revert to previous Git Commit tag (v0.9.x).
2.  **Command**: `git revert HEAD` or Redeploy previous build via Vercel Dashboard.
3.  **Communication**: Notify stakeholders of rollback and investigate root cause.

---

## 5. 📝 Post-Release Tasks
- [ ] Monitor "Consultation" conversion rates (New UI vs Old).
- [ ] Collect user feedback on "Smart Search" usability.
- [ ] Schedule code cleanup for unused legacy components (Phase 5).
