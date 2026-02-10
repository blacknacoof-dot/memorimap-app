-- [20260203] Fix RPC Overloading Conflict (PGRST203)
-- Drop all existing versions of the function to clear overloading
DROP FUNCTION IF EXISTS public.search_facilities_by_text(text, text);
DROP FUNCTION IF EXISTS public.search_facilities_by_text(text, text, integer);

-- Create a single, clean version with default parameters
CREATE OR REPLACE FUNCTION public.search_facilities_by_text(
  p_text text,
  p_category text DEFAULT NULL,
  p_max_results int DEFAULT 10
)
RETURNS SETOF public.facilities
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.facilities
  WHERE
    -- Use explicit table qualification to avoid ambiguity and satisfy linter
    (public.facilities.name ILIKE '%' || p_text || '%' OR public.facilities.address ILIKE '%' || p_text || '%')
    AND 
    (p_category IS NULL OR p_category = '' OR p_category = '전체' OR public.facilities.type::text = p_category)
    AND public.facilities.latitude IS NOT NULL 
    AND public.facilities.longitude IS NOT NULL
  LIMIT p_max_results;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.search_facilities_by_text(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_facilities_by_text(text, text, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_facilities_by_text(text, text, integer) TO service_role;
