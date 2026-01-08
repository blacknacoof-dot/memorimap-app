-- ==========================================================
-- [Search Bot Engine] Advanced Search RPC (v2)
-- ==========================================================

CREATE OR REPLACE FUNCTION public.search_facilities_v2(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 5000,
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    type TEXT,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    distance DOUBLE PRECISION,
    rating NUMERIC,
    review_count INTEGER,
    image_url TEXT,
    price_range TEXT,
    features TEXT[],
    description TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.type,
        f.address,
        st_y(f.location::geometry) as lat,
        st_x(f.location::geometry) as lng,
        st_distance(
            f.location::geography,
            st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
        ) as distance,
        f.rating,
        f.review_count,
        f.image_url,
        f.price_range,
        f.features,
        f.description
    FROM 
        public.facilities f
    WHERE 
        (p_category IS NULL OR f.category = p_category OR f.type = p_category)
        AND st_dwithin(
            f.location::geography,
            st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
            p_radius_meters
        )
    ORDER BY 
        distance ASC
    LIMIT 
        p_limit;
END;
$$;
