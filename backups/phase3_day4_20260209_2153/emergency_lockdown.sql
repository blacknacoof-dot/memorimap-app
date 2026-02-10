-- ⚠️ CRITICAL: EXECUTE IMMEDIATELY IN SUPABASE SQL EDITOR
-- Purpose: Emergency Lockdown to stop data leakage/manipulation
-- Fix v2: Removed invalid column 'forcerowsecurity' from verification query

BEGIN;

-- 1. Enable and Force RLS on all USER tables in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns', 'raster_columns', 'raster_overviews')
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
        
        -- FORCE RLS
        EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', r.schemaname, r.tablename);
        
        RAISE NOTICE 'Secured table: %.%', r.schemaname, r.tablename;
    END LOOP;
END $$;

-- 2. DROP ALL Policies that allow 'public' access
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND (
            roles @> '{public}' 
            OR roles @> '{anon}'
            OR roles IS NULL
        )
        AND tablename NOT IN ('spatial_ref_sys')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
            
        RAISE NOTICE 'Dropped unsafe policy: % on %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

COMMIT;

-- 3. Verification Query (Fixed)
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT IN ('spatial_ref_sys');
