-- =========================================================
-- Fix Facilities & Companies Read Access (Public)
-- =========================================================

-- 1. Facilities: Allow Public Select
--    This ensures anyone can search/view facilities.
DROP POLICY IF EXISTS "Allow public select" ON public.facilities;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.facilities;

CREATE POLICY "Allow public select"
ON public.facilities
FOR SELECT
TO public
USING (true);

-- 2. Funeral Companies: Allow Public Select
--    Required for Sangjo search results.
DROP POLICY IF EXISTS "Allow public select" ON public.funeral_companies;

CREATE POLICY "Allow public select"
ON public.funeral_companies
FOR SELECT
TO public
USING (true);

-- 3. Grant Permissions to roles (Crucial)
GRANT SELECT ON public.facilities TO anon, authenticated, service_role;
GRANT SELECT ON public.funeral_companies TO anon, authenticated, service_role;

-- 4. Verify RPC Permissions (Optional but recommended)
--    Ensure the search functions are executable by public
GRANT EXECUTE ON FUNCTION public.search_facilities_v2 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_distinct_regions TO anon, authenticated, service_role;

-- 5. Force Refresh Schema Cache (Not always needed but good practice)
NOTIFY pgrst, 'reload config';
