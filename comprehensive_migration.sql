-- ⚠️ FINAL COMPREHENSIVE MIGRATION (Attempts 2 - Public Schema Fix)
-- Fix: Moved functions from 'auth' schema to 'public' schema to avoid Permission Denied errors.

BEGIN;

-- =================================================================
-- PHASE 0: PRE-CLEANUP (Drop RLS)
-- =================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE tablename IN ('users', 'profiles', 'memorial_spaces', 'partner_inquiries', 'favorites', 'leads', 'consultations', 'facility_submissions', 'user_likes')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;


-- =================================================================
-- PHASE 1: SAFE UUID -> TEXT CONVERSION
-- =================================================================

-- 1. DROP DEFAULT VALUES
ALTER TABLE IF EXISTS users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS profiles ALTER COLUMN id DROP DEFAULT;

-- 2. DROP FOREIGN KEY CONSTRAINTS
ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE IF EXISTS memorial_spaces DROP CONSTRAINT IF EXISTS memorial_spaces_owner_user_id_fkey;
ALTER TABLE IF EXISTS partner_inquiries DROP CONSTRAINT IF EXISTS partner_inquiries_user_id_fkey;
ALTER TABLE IF EXISTS favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE IF EXISTS leads DROP CONSTRAINT IF EXISTS leads_user_id_fkey;
ALTER TABLE IF EXISTS leads DROP CONSTRAINT IF EXISTS leads_user_id_fkey1;
ALTER TABLE IF EXISTS consultations DROP CONSTRAINT IF EXISTS consultations_user_id_fkey;
ALTER TABLE IF EXISTS facility_submissions DROP CONSTRAINT IF EXISTS facility_submissions_applicant_user_id_fkey;
ALTER TABLE IF EXISTS user_likes DROP CONSTRAINT IF EXISTS user_likes_user_id_fkey;
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_id_fkey; 


-- 3. TYPE CONVERSION (UUID -> TEXT)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users ALTER COLUMN id TYPE TEXT USING id::TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') THEN
            ALTER TABLE profiles ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
        END IF;
    END IF;
END $$;

ALTER TABLE memorial_spaces ALTER COLUMN owner_user_id TYPE TEXT;
ALTER TABLE partner_inquiries ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE favorites ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE leads ALTER COLUMN user_id TYPE TEXT;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'user_id') THEN
        ALTER TABLE consultations ALTER COLUMN user_id TYPE text;
    END IF;
END $$;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facility_submissions' AND column_name = 'applicant_user_id') THEN
        ALTER TABLE facility_submissions ALTER COLUMN applicant_user_id TYPE text;
    END IF;
END $$;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_likes' AND column_name = 'user_id') THEN
        ALTER TABLE user_likes ALTER COLUMN user_id TYPE text;
    END IF;
END $$;


-- 4. CLERK_ID COLUMN & DATA COPY
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            clerk_id TEXT UNIQUE NOT NULL,
            email TEXT,
            name TEXT,
            image_url TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT;
        UPDATE users SET clerk_id = id WHERE clerk_id IS NULL;
    END IF;
END $$;


-- =================================================================
-- PHASE 2: JWT AUTH FUNCTIONS (Fixed: public schema)
-- =================================================================

-- Drop old versions if they exist
DROP FUNCTION IF EXISTS public.clerk_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.user_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- Clerk User ID Extractor (Public Schema)
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS TEXT AS $$
DECLARE
  jwt_claims JSONB;
  user_id TEXT;
BEGIN
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true)::JSONB;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  IF jwt_claims IS NULL THEN
    RETURN NULL;
  END IF;

  user_id := jwt_claims->>'sub';
  
  IF user_id IS NULL OR user_id = '' THEN
    RETURN NULL;
  END IF;

  RETURN user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper
CREATE OR REPLACE FUNCTION public.user_id()
RETURNS TEXT AS $$
  SELECT public.clerk_user_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Super Admin Check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id TEXT;
BEGIN
  current_user_id := public.clerk_user_id();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM profiles
    WHERE id = current_user_id
      AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- =================================================================
-- PHASE 3: RLS POLICIES (Updated to use public.* functions)
-- =================================================================

-- 1. USERS TABLE
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON users FOR SELECT TO authenticated
USING (clerk_id = public.clerk_user_id() OR public.is_super_admin());

CREATE POLICY "users_insert_new" ON users FOR INSERT TO authenticated
WITH CHECK (
    clerk_id = public.clerk_user_id() 
    OR 
    (clerk_id IS NOT NULL)
);

CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated
USING (clerk_id = public.clerk_user_id() OR public.is_super_admin());

CREATE POLICY "users_select_by_clerk_id_public" ON users FOR SELECT TO anon, authenticated
USING (true);


-- 2. PROFILES TABLE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT TO anon USING (true);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated
WITH CHECK (id = public.clerk_user_id());

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
USING (id = public.clerk_user_id());


-- 3. MEMORIAL SPACES
ALTER TABLE memorial_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facilities_select_public" ON memorial_spaces FOR SELECT TO public USING (true);

CREATE POLICY "facilities_insert_auth" ON memorial_spaces FOR INSERT TO authenticated
WITH CHECK (owner_user_id = public.clerk_user_id());

CREATE POLICY "facilities_update_own" ON memorial_spaces FOR UPDATE TO authenticated
USING (owner_user_id = public.clerk_user_id() OR public.is_super_admin());


-- 4. OTHER TABLES
-- Favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_select_own" ON favorites FOR SELECT TO authenticated USING (user_id = public.clerk_user_id());
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT TO authenticated WITH CHECK (user_id = public.clerk_user_id());
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE TO authenticated USING (user_id = public.clerk_user_id());

-- Leads (Allow Public)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_insert_public" ON leads FOR INSERT TO public WITH CHECK (true);


-- =================================================================
-- PHASE 4: CLEANUP & RPC FIXES
-- =================================================================

DROP FUNCTION IF EXISTS approve_partner_and_grant_role(uuid, uuid);
DROP FUNCTION IF EXISTS approve_partner_and_grant_role(uuid, text);

CREATE OR REPLACE FUNCTION approve_partner_and_grant_role(
    inquiry_id UUID,
    target_user_id TEXT 
) RETURNS VOID AS $$
BEGIN
    UPDATE partner_inquiries SET status = 'approved' WHERE id = inquiry_id;
    IF target_user_id IS NOT NULL THEN
        INSERT INTO profiles (id, role) VALUES (target_user_id, 'facility_admin')
        ON CONFLICT (id) DO UPDATE SET role = 'facility_admin';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION approve_partner_and_grant_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_partner_and_grant_role(uuid, text) TO anon;

COMMIT;

SELECT 'Migration (Attempt 2) with Public Schema Functions Complete' as status;
