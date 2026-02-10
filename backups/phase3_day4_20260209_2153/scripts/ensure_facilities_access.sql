-- 1. Ensure RLS is enabled for facilities
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- 2. Create/Replace Policy for Public Read Access on 'facilities'
-- First drop to avoid error if exists with different name/config
DROP POLICY IF EXISTS "Public can view facilities" ON public.facilities;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.facilities;

CREATE POLICY "Public can view facilities"
ON public.facilities
FOR SELECT
USING (true);

-- 3. Grant SELECT permissions to roles
GRANT SELECT ON public.facilities TO anon;
GRANT SELECT ON public.facilities TO authenticated;
GRANT SELECT ON public.facilities TO service_role;


-- 4. Ensure 'facility_images' table exists and has public access (for future proofing)
CREATE TABLE IF NOT EXISTS public.facility_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.facility_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view facility_images" ON public.facility_images;

CREATE POLICY "Public can view facility_images"
ON public.facility_images
FOR SELECT
USING (true);

GRANT SELECT ON public.facility_images TO anon;
GRANT SELECT ON public.facility_images TO authenticated;
GRANT SELECT ON public.facility_images TO service_role;

-- 5. Fix 'favorites' table just in case (Consolidate policies)
-- The user showed multiple policies for favorites, which is messy but working. 
-- We won't touch favorites again unless requested, to avoid breaking what works.
