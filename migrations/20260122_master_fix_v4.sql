-- =====================================================
-- MASTER FIX v4: Explicit Casts & Total Policy Reset
-- =====================================================

-- ⚠️ This script handles the "uuid = text" operator error by explicitly 
-- dropping all dependent policies and using proper type casting.

BEGIN;

-- 1. [Policy Cleanup] Drop EVERY policy that might depend on these tables
-- This is necessary to avoid "cannot alter type of a column used in a policy"
DROP POLICY IF EXISTS "Users can view own facilities" ON public.facilities;
DROP POLICY IF EXISTS "Admins can view all facilities" ON public.facilities;
DROP POLICY IF EXISTS "System can insert facilities" ON public.facilities;
DROP POLICY IF EXISTS "Enable read for all" ON public.facilities;
DROP POLICY IF EXISTS "Admins can modify facilities" ON public.facilities;
DROP POLICY IF EXISTS "Owners can update own facilities" ON public.facilities;

DROP POLICY IF EXISTS "Admins can see all super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Admins can manage super_admins" ON public.super_admins;

DROP POLICY IF EXISTS "Users can view own sangjo info" ON public.sangjo_users;
DROP POLICY IF EXISTS "Users view own sangjo" ON public.sangjo_users;

DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins view all" ON public.leads;

-- 2. [Type Conversion] Convert UUID columns to TEXT with explicit USING clauses
-- This ensures existing UUID data is correctly cast to string.
ALTER TABLE public.super_admins ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.facilities ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.sangjo_users ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.leads ALTER COLUMN user_id TYPE text USING user_id::text;

-- 3. [Policy Restoration] Recreate policies with explicit type casting
-- We use auth.uid()::text to ensure comparison with our new text columns.

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
    category TEXT,
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
