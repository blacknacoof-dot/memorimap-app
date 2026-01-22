-- 1. Drop the old function with 'float' (double precision) signature to avoid conflict
DROP FUNCTION IF EXISTS search_facilities_in_view(float, float, float, float);

-- 2. Create the new function using 'numeric' to match the actual table columns
CREATE OR REPLACE FUNCTION search_facilities_in_view(
  min_lat numeric,
  min_lng numeric,
  max_lat numeric,
  max_lng numeric
)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  lat numeric,
  lng numeric,
  category text,
  image_url text,
  rating numeric,
  review_count integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    f.id,
    f.name,
    f.address,
    f.latitude AS lat,
    f.longitude AS lng,
    f.type AS category,
    f.image_url,
    f.rating,
    f.review_count
  FROM facilities f
  WHERE
    f.latitude BETWEEN min_lat AND max_lat
    AND f.longitude BETWEEN min_lng AND max_lng;
$$;
