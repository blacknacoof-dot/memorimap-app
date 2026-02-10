-- Grant execute permissions on search RPCs to anon and authenticated roles
-- This fixes the 401 Unauthorized error when searching facilities without login

-- Using 'double precision' instead of 'float' to match exact definition
GRANT EXECUTE ON FUNCTION public.search_facilities(double precision, double precision, int, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_facilities_v2(double precision, double precision, int, text, int) TO anon, authenticated, service_role;

-- Corrected signature: only 2 args (text, text) - no limit arg in definition
GRANT EXECUTE ON FUNCTION public.search_facilities_by_text(text, text) TO anon, authenticated, service_role;

-- get_distinct_regions usually takes (text)
GRANT EXECUTE ON FUNCTION public.get_distinct_regions(text) TO anon, authenticated, service_role;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
