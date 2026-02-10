-- =========================================================
-- Fix Search RPC to use 'facilities' table (Corrected Column Name)
-- =========================================================

DROP FUNCTION IF EXISTS public.search_facilities_by_text;

CREATE OR REPLACE FUNCTION public.search_facilities_by_text(
    p_text TEXT,
    p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT, -- Returning alias
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    rating NUMERIC,        
    review_count NUMERIC,  
    image_url TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_search_pattern TEXT;
BEGIN
    v_search_pattern := '%' || REPLACE(p_text, ' ', '%') || '%';

    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        -- [Fix] Use facility_type if category column doesn't exist, or fallback
        -- Based on error 'column category does not exist', we assume facility_type is the one.
        f.facility_type as category,  
        f.address,
        f.lat::DOUBLE PRECISION, 
        f.lng::DOUBLE PRECISION,
        COALESCE(f.rating, 0)::NUMERIC,       
        0::NUMERIC as review_count, 
        f.image_url
    FROM 
        public.facilities f
    WHERE 
        (f.address ILIKE v_search_pattern OR f.name ILIKE v_search_pattern)
        AND (p_category IS NULL OR f.facility_type = p_category) -- [Fix] Filter by facility_type
    LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_facilities_by_text TO anon, authenticated, service_role;
