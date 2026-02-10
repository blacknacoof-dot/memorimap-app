-- =====================================================
-- MASTER FIX v5: Dynamic Policy Cleanup & Type Alignment
-- =====================================================

-- This script uses dynamic SQL to drop ALL policies on target tables 
-- before altering types, ensuring no "policy dependency" errors.

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 1. Dynamically drop all policies on target tables
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('facilities', 'super_admins', 'sangjo_users', 'leads')
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

BEGIN;

-- 2. [Type Conversion] Convert UUID columns to TEXT with explicit USING clauses
-- This ensures existing UUID data is correctly cast to string for Clerk ID compatibility.
ALTER TABLE public.super_admins ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.facilities ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.sangjo_users ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.leads ALTER COLUMN user_id TYPE text USING user_id::text;

-- 3. [Policy Restoration] Recreate standardized policies
-- Using auth.uid()::text to match the new TEXT column types.

-- [Super Admins]
CREATE POLICY "Super Admins are readable by all" ON public.super_admins FOR SELECT USING (true);

-- [Facilities]
CREATE POLICY "Enable read for all" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Admins can modify facilities" ON public.facilities FOR ALL 
USING (
  exists (
    select 1 from public.super_admins 
    where super_admins.id = auth.uid()::text
  )
);
CREATE POLICY "Owners can update own facilities" ON public.facilities FOR UPDATE
USING (auth.uid()::text = user_id);

-- [Sangjo Users]
CREATE POLICY "Everyone can read sangjo status" ON public.sangjo_users FOR SELECT USING (true);
CREATE POLICY "Users view own sangjo" ON public.sangjo_users FOR SELECT USING (auth.uid()::text = user_id);

-- [Leads]
CREATE POLICY "Admins view all leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Users view own leads" ON public.leads FOR SELECT USING (auth.uid()::text = user_id);

-- 4. [Search RPC] Update to be robust
CREATE OR REPLACE FUNCTION public.search_facilities(
    p_lat float,
    p_lng float,
    p_radius_meters int DEFAULT 500000,
    p_query text DEFAULT NULL 
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT, -- Alias for type
    type TEXT,
    address TEXT,
    lat DECIMAL,
    lng DECIMAL,
    phone TEXT,
    dist_meters FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.type as category, 
        f.type,
        f.address,
        f.latitude as lat,
        f.longitude as lng,
        f.phone,
        (
            6371000 * acos(
                cos(radians(p_lat)) * cos(radians(f.latitude)) *
                cos(radians(f.longitude) - radians(p_lng)) +
                sin(radians(p_lat)) * sin(radians(f.latitude))
            )
        )::float as dist_meters
    FROM 
        public.facilities f
    WHERE 
        f.latitude IS NOT NULL AND f.longitude IS NOT NULL
        AND (
            6371000 * acos(
                cos(radians(p_lat)) * cos(radians(f.latitude)) *
                cos(radians(f.longitude) - radians(p_lng)) +
                sin(radians(p_lat)) * sin(radians(f.latitude))
            )
        ) < p_radius_meters
    ORDER BY 
        dist_meters ASC;
END;
$$;

COMMIT;
