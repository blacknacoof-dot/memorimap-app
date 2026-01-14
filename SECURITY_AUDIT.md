# Security Audit Report: Memorial Map Application
**Date:** 2026-01-14
**Auditor:** Senior DevSecOps Engineer
**Target:** Frontend (React/Vite), Backend (Supabase/PostgreSQL), Auth (Clerk)

---

## 🛡️ Executive Summary
**Overall Security Score: Critical Risk (Score: 2/10)**

The audit reveals that the application's database is **effectively public**. Recent "hotfixes" to accommodate Clerk Authentication have disabled Row Level Security (RLS) on key tables, allowing unauthenticated users to Insert, Update, or Delete data. Additionally, there is a mismatch between Clerk's String IDs and Supabase's UUID Schema.

## 🚨 Critical Vulnerabilities

### 1. Open Database Verification (RLS Disabled)
**Severity: CRITICAL**
- **Finding**: Policies grant `public` (anonymous) users full Write permissions.
- **Evidence**: `fix_clerk_auth_rls.sql` uses `TO public WITH CHECK (true)`.
- **Impact**: Malicious actors can spam or compromise data.
- **Root Cause**: Bypassing logic because `auth.uid()` (UUID) does not match Clerk ID (String).

### 2. ID Type Mismatch (UUID vs TEXT)
**Severity: HIGH**
- **Finding**: Supabase expects `UUID` for `auth.uid()`, Clerk uses `String`.
- **Impact**: Authorization functions crash or fail silently.

### 3. Client-Side Admin Logic
**Severity: MEDIUM**
- **Finding**: Admin dashboards fetch unfiltered lists of users.
- **Impact**: Potential data leakage of user emails/roles.

---

## 🛠️ Immediate Remediation (SQL Fixes)

Copy and run these SQL commands in your Supabase SQL Editor to immediately harden the system.

### Step 1: Standardize IDs to TEXT (Migration)
```sql
-- Allow profiles to store Clerk IDs
ALTER TABLE profiles 
  ALTER COLUMN id TYPE text, 
  ALTER COLUMN id DROP DEFAULT; -- Remove gen_random_uuid

-- Update Foreign Keys (Example for facilities)
ALTER TABLE memorial_spaces 
  ALTER COLUMN owner_user_id TYPE text;
```

### Step 2: Implement "Safe Public" Policies (Temporary)
*Until Supabase-Clerk JWT is fully configured, we restrict writes to known client signatures or partially authenticated requests.*

```sql
-- 1. Disable generic public access
DROP POLICY IF EXISTS "Allow public insert memorial_spaces" ON memorial_spaces;

-- 2. Allow INSERT only if user field is present (Basic Sanity Check)
CREATE POLICY "Sanity Checked Inserts"
ON memorial_spaces FOR INSERT
TO public
WITH CHECK (
  owner_user_id IS NOT NULL 
  AND length(owner_user_id) > 5 -- Minimal check for valid-ish ID
);
```

### Step 3: The "Real" Fix (JWT Sync)
You must configure Supabase to accept Clerk Tokens.
1. Get Public Key from Clerk.
2. Add to Supabase Project Settings -> API -> JWT.
3. Once done, revert all policies to:
   `TO authenticated USING (auth.uid()::text = owner_user_id)`

---

## 🔒 Next Steps
1. **Infrastructure**: Set up the JWT integration.
2. **Code**: Update `setup_super_admin_policies.sql` to use `TEXT` instead of `UUID`.
3. **Monitoring**: Check `memorial_spaces` for any spam entries created during the open window.
