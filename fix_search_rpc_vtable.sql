-- =========================================================
-- Fix Search RPC to use 'facilities' table
-- =========================================================

DROP FUNCTION IF EXISTS public.search_facilities_by_text;

CREATE OR REPLACE FUNCTION public.search_facilities_by_text(
    p_text TEXT,
    p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,             -- facilities table usually uses UUID
    name TEXT,
    category TEXT,
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
    -- [1] Normalization: Convert space to % for fuzzy matching
    v_search_pattern := '%' || REPLACE(p_text, ' ', '%') || '%';

    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.category,  -- Ensure this column exists in 'facilities'
        f.address,
        f.lat::DOUBLE PRECISION, 
        f.lng::DOUBLE PRECISION,
        COALESCE(f.rating, 0)::NUMERIC,       
        0::NUMERIC as review_count, -- Or join with reviews to count
        f.image_url
    FROM 
        public.facilities f
    WHERE 
        -- [2] Core Search Logic
        (f.address ILIKE v_search_pattern OR f.name ILIKE v_search_pattern)
        -- [3] Optional Category Filter
        AND (p_category IS NULL OR f.category = p_category)
    LIMIT 20;
END;
$$;

-- Grant permissions for the new function signature
GRANT EXECUTE ON FUNCTION public.search_facilities_by_text TO anon, authenticated, service_role;
