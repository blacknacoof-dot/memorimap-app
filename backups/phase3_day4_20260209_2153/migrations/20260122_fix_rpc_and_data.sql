-- =====================================================
-- Fix Search RPC & Restore Data (v4 Post-Fix)
-- =====================================================

-- 1. Restore Data from Backup (if exists)
-- We need to populate the new 'facilities' table from 'facilities_backup_v4'
-- Mapping: user_id provided as default, type/category handling.
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facilities_backup_v4') THEN
        INSERT INTO public.facilities (
            user_id,
            name, 
            type, 
            address, 
            address_detail,
            latitude,
            longitude,
            phone,
            status,
            created_at,
            updated_at
        )
        SELECT 
            'system_legacy_import', -- Default User ID for migrated data
            name,
            -- Try to map category/type. Assuming old table had 'category' or 'type'. 
            -- We'll try to cast simple or fallback. 
            COALESCE(type, 'complex'), 
            address,
            NULL, -- address_detail
            latitude,
            longitude,
            phone,
            'active',
            now(),
            now()
        FROM public.facilities_backup_v4
        ON CONFLICT DO NOTHING; -- Avoid dupes if run multiple times
    END IF;
END $$;


-- 2. Drop Broken RPCs
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text, int);
DROP FUNCTION IF EXISTS search_facilities(numeric, numeric, int, text, int);
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text);
DROP FUNCTION IF EXISTS search_facilities(numeric, numeric, int, text);

-- 3. Recreate RPC looking at NEW facilities table
-- Note: Frontend likely expects 'category' field. We alias 'type' as 'category'.
CREATE OR REPLACE FUNCTION public.search_facilities(
    p_lat float,
    p_lng float,
    p_radius_meters int DEFAULT 10000,
    p_query text DEFAULT NULL -- Adding query param support if needed, or keeping signature simple
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
        f.type as category, -- Map type to category
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
    LIMIT 50;
END;
$$;
