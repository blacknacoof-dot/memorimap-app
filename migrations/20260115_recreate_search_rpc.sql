-- 1. function drop just in case to avoid ambiguity (optional, but good practice if signatures differ slightly)
DROP FUNCTION IF EXISTS public.search_facilities_by_text(text, text);
DROP FUNCTION IF EXISTS public.search_facilities_by_text(text, text, int);

-- 2. Define function strictly as requested
CREATE OR REPLACE FUNCTION public.search_facilities_by_text(
  search_term text,      -- 검색어
  filter_type text,      -- 카테고리 (NULL이면 전체)
  max_results int        -- 최대 반환 개수
)
RETURNS SETOF facilities
LANGUAGE plpgsql
SECURITY INVOKER         -- RLS 적용
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM facilities
  WHERE
    -- 1. Name or Address Match
    (name ILIKE '%' || search_term || '%' OR address ILIKE '%' || search_term || '%')
    AND 
    -- 2. Category Filter (Cast enum to text for comparison)
    (filter_type IS NULL OR filter_type = '' OR filter_type = '전체' OR category::text = filter_type)
  LIMIT max_results;
END;
$$;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION public.search_facilities_by_text(text, text, int) TO anon, authenticated, service_role;

-- Grant others as well just to be sure they adhere to the same visibility
GRANT EXECUTE ON FUNCTION public.search_facilities(double precision, double precision, int, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_facilities_v2(double precision, double precision, int, text, int) TO anon, authenticated, service_role;
