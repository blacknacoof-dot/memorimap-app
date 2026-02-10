-- Restore search_facilities_v2 function
-- This function was identified as missing (404 error) but required by getIntelligentRecommendations.
-- It performs a radius search using PostGIS.

DROP FUNCTION IF EXISTS public.search_facilities_v2(double precision, double precision, integer, text, integer);

CREATE OR REPLACE FUNCTION public.search_facilities_v2(
    p_lat double precision,
    p_lng double precision,
    radius_meters integer DEFAULT 5000,
    category text DEFAULT NULL::text,
    result_limit integer DEFAULT 20
)
RETURNS SETOF facilities
LANGUAGE sql
STABLE
AS $function$
    SELECT *
    FROM facilities
    WHERE
        latitude IS NOT NULL AND longitude IS NOT NULL
        AND (
            category IS NULL 
            OR facilities.type = category
            OR (category = 'memorial' AND facilities.type IN ('charnel_house', 'natural_burial', 'tree_burial', 'park_cemetery', 'complex', 'sea_burial', 'memorial', '봉안시설', '자연장', '공원묘지', '해양장'))
        )
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            radius_meters
        )
    ORDER BY
        ST_Distance(
            ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) ASC
    LIMIT result_limit;
$function$;
