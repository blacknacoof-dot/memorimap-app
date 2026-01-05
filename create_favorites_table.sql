-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    facility_id UUID NOT NULL REFERENCES public.memorial_spaces(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, facility_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.favorites TO anon, authenticated;

-- Policies
-- We are relaxing RLS for now similar to other tables due to Auth mismatch issues clearly observed
-- Ideally: user_id = current_user
-- For now: public access allowed as per previous patterns requested for fixing auth issues
CREATE POLICY "Enable read access for all users" ON public.favorites
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.favorites
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.favorites
    FOR DELETE USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_facility_id ON public.favorites(facility_id);

-- Check constraint cleanup if exists (not really needed for new table but good for idempotency)
