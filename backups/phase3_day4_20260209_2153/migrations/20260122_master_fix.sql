-- =====================================================
-- MASTER FIX: ID Type & RPC Search Function
-- =====================================================

BEGIN;

-- 1. [Critical] Change ID column types from UUID to TEXT for Clerk compatibility
-- This resolves the 400 Bad Request errors when joining with Clerk IDs
ALTER TABLE public.super_admins ALTER COLUMN id TYPE text;
ALTER TABLE public.facilities ALTER COLUMN manager_id TYPE text;
ALTER TABLE public.sangjo_users ALTER COLUMN user_id TYPE text;
-- Also leads table if referenced
ALTER TABLE public.leads ALTER COLUMN user_id TYPE text;

-- 2. Drop existing search functions to avoid conflicts/signatures mismatch
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text, int);
DROP FUNCTION IF EXISTS search_facilities(numeric, numeric, int, text, int);
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text);
DROP FUNCTION IF EXISTS search_facilities(numeric, numeric, int, text);
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text, text); -- cleanup all variants

COMMIT;

-- 3. Recreate search_facilities RPC
-- Maps 'type' -> 'category' and 'latitude' -> 'lat' for frontend compatibility
CREATE OR REPLACE FUNCTION public.search_facilities(
    p_lat float,
    p_lng float,
    p_radius_meters int DEFAULT 100000,
    p_query text DEFAULT NULL 
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT, -- Frontend expects 'category'
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
        f.type as category, -- Alias type to category
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
        dist_meters ASC
    LIMIT 100;
END;
$$;
