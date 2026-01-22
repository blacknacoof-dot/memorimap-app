-- =====================================================
-- MASTER FIX v3: ID Type Alignment & Policy Handling
-- =====================================================

BEGIN;

-- 1. [Facilities] Drop dependent policies and change column type
-- We need to drop any policies using the user_id column before changing its type.
DROP POLICY IF EXISTS "Users can view own facilities" ON public.facilities;
DROP POLICY IF EXISTS "Admins can view all facilities" ON public.facilities;
DROP POLICY IF EXISTS "System can insert facilities" ON public.facilities;

ALTER TABLE public.facilities ALTER COLUMN user_id TYPE text;

-- Recreate policies for facilities (Standardized v4 Policy)
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

-- 2. [Super Admins] Change column type (No complex policies usually depend on this as they just SELECT)
-- If there are policies on super_admins, drop them here first.
ALTER TABLE public.super_admins ALTER COLUMN id TYPE text;

-- 3. [Sangjo Users] Change column type
DROP POLICY IF EXISTS "Users can view own sangjo info" ON public.sangjo_users;
ALTER TABLE public.sangjo_users ALTER COLUMN user_id TYPE text;
CREATE POLICY "Users view own sangjo" ON public.sangjo_users FOR SELECT USING (auth.uid()::text = user_id);

-- 4. [Leads] Change column type
ALTER TABLE public.leads ALTER COLUMN user_id TYPE text;

-- 5. RPC Search Function Update
-- [Fixed] Aliasing type to category for frontend, latitude to lat, longitude to lng
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
