-- =====================================================
-- MASTER FIX v6: Final Schema Alignment & Image Fix
-- =====================================================

-- This script resolves:
-- 1. "column facilities.ai_context does not exist"
-- 2. "column facilities.type does not exist" (renaming category -> type)
-- 3. Missing image columns causing placeholder fallbacks

BEGIN;

-- 1. [Policy Cleanup] Drop all policies on facilities to allow column changes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'facilities' AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.facilities';
    END LOOP;
END $$;

-- 2. [Schema Alignment] Ensure columns match frontend expectations
-- Rename category to type if category exists and type doesn't
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='facilities' AND column_name='category') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='facilities' AND column_name='type') THEN
        ALTER TABLE public.facilities RENAME COLUMN category TO type;
    END IF;
END $$;

-- Add missing columns
ALTER TABLE public.facilities 
ADD COLUMN IF NOT EXISTS type TEXT, -- Fallback if neither existed
ADD COLUMN IF NOT EXISTS ai_context TEXT,
ADD COLUMN IF NOT EXISTS ai_features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_welcome_message TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 3. [Type Casting] Ensure correct types for ID and User ID
ALTER TABLE public.facilities ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE public.facilities ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 4. [Policy Restoration]
CREATE POLICY "Enable read for all" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Owners can update own facilities" ON public.facilities FOR ALL
USING (auth.uid()::text = user_id);

-- 5. [RPC Fix] Update search_facilities to use Correct Column Names
DROP FUNCTION IF EXISTS public.search_facilities(float, float, int, text);
CREATE OR REPLACE FUNCTION public.search_facilities(
    user_lat float,
    user_lng float,
    radius_meters int DEFAULT 50000,
    filter_category text DEFAULT NULL 
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    type TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    phone TEXT,
    image_url TEXT,
    images TEXT[],
    dist_meters FLOAT
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
        f.latitude,
        f.longitude,
        f.phone,
        f.image_url,
        f.images,
        (
            6371000 * acos(
                cos(radians(user_lat)) * cos(radians(f.latitude)) *
                cos(radians(f.longitude) - radians(user_lng)) +
                sin(radians(user_lat)) * sin(radians(f.latitude))
            )
        )::float as dist_meters
    FROM 
        public.facilities f
    WHERE 
        f.latitude IS NOT NULL AND f.longitude IS NOT NULL
        AND (filter_category IS NULL OR f.type = filter_category)
        AND (
            6371000 * acos(
                cos(radians(user_lat)) * cos(radians(f.latitude)) *
                cos(radians(f.longitude) - radians(user_lng)) +
                sin(radians(user_lat)) * sin(radians(f.latitude))
            )
        ) < radius_meters
    ORDER BY 
        dist_meters ASC;
END;
$$;

COMMIT;
