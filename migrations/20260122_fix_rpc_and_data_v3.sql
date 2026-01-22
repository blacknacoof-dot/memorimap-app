-- =====================================================
-- Fix Search RPC & Restore Data (v3 - Precise Mapping)
-- Purpose: Restore data from facilities_backup_v4 using known schema
-- Source Cols: lat, lng, category, manager_id, is_verified
-- Target Cols: latitude, longitude, type, user_id, verified
-- =====================================================

-- 1. Restore Data
-- We explicitly map the columns provided by the user.
INSERT INTO public.facilities (
    user_id,
    name, 
    type, 
    address, 
    latitude,
    longitude,
    phone,
    description, -- Added since source has it
    verified,    -- Map from is_verified
    status,
    created_at,
    updated_at
)
SELECT 
    COALESCE(manager_id::text, 'system_legacy_import'), -- Map manager_id -> user_id
    name,
    category, -- Map category -> type
    address,
    lat, -- Map lat -> latitude
    lng, -- Map lng -> longitude
    phone,
    description,
    COALESCE(is_verified, false), -- Map is_verified -> verified
    'active',
    created_at,
    updated_at
FROM public.facilities_backup_v4
ON CONFLICT DO NOTHING;

-- 2. Drop Broken RPCs (Cleanup)
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text, int);
DROP FUNCTION IF EXISTS search_facilities(numeric, numeric, int, text, int);
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text);
DROP FUNCTION IF EXISTS search_facilities(numeric, numeric, int, text);

-- 3. Recreate RPC (Using NEW table schema)
-- The new table has 'type', 'latitude', 'longitude'.
-- Frontend expects 'category', 'lat', 'lng'. We alias them.
CREATE OR REPLACE FUNCTION public.search_facilities(
    p_lat float,
    p_lng float,
    p_radius_meters int DEFAULT 10000,
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
        f.type as category, -- Alias type -> category
        f.type,
        f.address,
        f.latitude as lat, -- Alias latitude -> lat
        f.longitude as lng, -- Alias longitude -> lng
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
    LIMIT 50;
END;
$$;
