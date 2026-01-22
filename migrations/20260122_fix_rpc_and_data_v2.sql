-- =====================================================
-- Fix Search RPC & Restore Data (v2 - Dynamic Column Check)
-- Purpose: Handle case where backup table has 'category' instead of 'type'
-- =====================================================

-- 1. Restore Data from Backup (Dynamic SQL)
DO $$ 
DECLARE
    v_has_type boolean;
    v_has_category boolean;
    v_sql text;
BEGIN
    -- Check if backup table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facilities_backup_v4') THEN
        
        -- Check for 'type' column
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'facilities_backup_v4' AND column_name = 'type'
        ) INTO v_has_type;
        
        -- Check for 'category' column
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'facilities_backup_v4' AND column_name = 'category'
        ) INTO v_has_category;

        -- Construct INSERT query based on available columns
        v_sql := 'INSERT INTO public.facilities (
            user_id, name, type, address, address_detail, latitude, longitude, phone, status, created_at, updated_at
        ) SELECT 
            ''system_legacy_import'', 
            name, ';

        IF v_has_type THEN
            v_sql := v_sql || 'COALESCE(type, ''complex''), ';
        ELSIF v_has_category THEN
            v_sql := v_sql || 'COALESCE(category, ''complex''), ';
        ELSE
            v_sql := v_sql || '''complex'', '; -- Fallback literal
        END IF;

        v_sql := v_sql || '
            address,
            NULL, 
            latitude,
            longitude,
            phone,
            ''active'',
            now(),
            now()
        FROM public.facilities_backup_v4
        ON CONFLICT DO NOTHING;';

        -- Execute the dynamic SQL
        EXECUTE v_sql;
        
        RAISE NOTICE 'Data restoration completed successfully.';
    ELSE
        RAISE NOTICE 'Backup table facilities_backup_v4 NOT found. Skipping restore.';
    END IF;
END $$;


-- 2. Drop Broken RPCs
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text, int);
DROP FUNCTION IF EXISTS search_facilities(numeric, numeric, int, text, int);
DROP FUNCTION IF EXISTS search_facilities(float, float, int, text);
DROP FUNCTION IF EXISTS search_facilities(numeric, numeric, int, text);

-- 3. Recreate RPC looking at NEW facilities table
-- Note: Frontend expects 'category'. We alias 'type' -> 'category'.
CREATE OR REPLACE FUNCTION public.search_facilities(
    p_lat float,
    p_lng float,
    p_radius_meters int DEFAULT 10000,
    p_query text DEFAULT NULL 
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT, -- Frontend expects this
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
        f.type as category, -- Alias type to category for frontend compatibility
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
