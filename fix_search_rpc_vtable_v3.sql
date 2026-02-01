-- =========================================================
-- Fix Search RPC to use 'facilities' table (Final Version: 'type' column)
-- =========================================================

DROP FUNCTION IF EXISTS public.search_facilities_by_text;

CREATE OR REPLACE FUNCTION public.search_facilities_by_text(
    p_text TEXT,
    p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT, -- Alias for 'type'
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
        f.type as category, -- [Fix] Use 'type' column
        f.address,
        f.latitude::DOUBLE PRECISION as lat,  -- [Fix] Use 'latitude' column (based on inspection)
        f.longitude::DOUBLE PRECISION as lng, -- [Fix] Use 'longitude' column
        COALESCE(f.rating, 0)::NUMERIC,       
        COALESCE(f.review_count, 0)::NUMERIC, 
        f.image_url
    FROM 
        public.facilities f
    WHERE 
        (f.address ILIKE v_search_pattern OR f.name ILIKE v_search_pattern)
        AND (p_category IS NULL OR f.type = p_category) -- [Fix] Filter by 'type'
    LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_facilities_by_text TO anon, authenticated, service_role;
