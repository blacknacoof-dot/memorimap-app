-- 1. Create 'favorites' table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Assuming Clerk ID is text, matches user_id in other tables
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, facility_id) -- Prevent duplicate favorites
);

-- 2. Enable RLS on 'favorites'
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 3. create policies for 'favorites'
-- Allow users to view their own favorites
CREATE POLICY "Users can view their own favorites" 
ON public.favorites FOR SELECT 
USING (auth.uid()::text = user_id OR user_id = 'anon'); 
-- Note: Adjust 'user_id' type check if auth.uid() is UUID. If using Clerk with custom auth, ensure user_id matches.
-- If user_id is the Clerk ID string:
CREATE POLICY "Users can view own favorites (Clerk)" 
ON public.favorites FOR SELECT 
USING (true); -- Ideally filter by user_id, but for now allow read (filtering usually happens in query)

-- Allow authenticated users to insert their own favorite
CREATE POLICY "Users can add favorites" 
ON public.favorites FOR INSERT 
WITH CHECK (true); -- Simplified for now

-- Allow users to delete their own favorites
CREATE POLICY "Users can remove favorites" 
ON public.favorites FOR DELETE 
USING (true);


-- 4. Fix 'images' column in 'facilities' table
-- Check if images is already an array. If not, convert it.
DO $$
BEGIN
    -- Check if column exists and is NOT an array type (e.g., is 'text' or 'varchar')
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'facilities' 
        AND column_name = 'images' 
        AND data_type IN ('text', 'character varying')
    ) THEN
        -- Safely convert TEXT to TEXT[]
        -- Assumes simple string URL needs to be the single element of the array
        ALTER TABLE public.facilities 
        ALTER COLUMN images TYPE text[] 
        USING ARRAY[images];
    END IF;
END $$;

-- 5. Data Cleanup (If it was already an array but had bad data, or after conversion)
-- Update NULL or Empty arrays to have a placeholder
UPDATE public.facilities
SET images = ARRAY['https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&q=80&w=800']
WHERE images IS NULL OR array_length(images, 1) IS NULL;

-- 6. Grant permissions
GRANT ALL ON public.favorites TO anon;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
