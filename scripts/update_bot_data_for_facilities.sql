-- FAQ DB Integration: Add facility_id support
-- Purpose: Enable facility-specific FAQ management

-- 1. Add facility_id column to bot_data table
ALTER TABLE public.bot_data 
ADD COLUMN IF NOT EXISTS facility_id BIGINT REFERENCES memorial_spaces(id) ON DELETE CASCADE;

-- 2. Create unique index for facility-specific FAQ (one FAQ set per facility)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_data_facility_id 
ON public.bot_data(facility_id) 
WHERE facility_id IS NOT NULL;

-- 3. Drop ALL old RLS policies to recreate them (idempotent)
DROP POLICY IF EXISTS "Admins can do everything on bot_data" ON public.bot_data;
DROP POLICY IF EXISTS "Public can read bot_data" ON public.bot_data;
DROP POLICY IF EXISTS "Facility owners can manage their FAQ" ON public.bot_data;
DROP POLICY IF EXISTS "Super admins can manage global FAQ" ON public.bot_data;

-- 4. Create new RLS policies

-- Global FAQ: Super Admin only (facility_id IS NULL)
CREATE POLICY "Super admins can manage global FAQ" ON public.bot_data
    FOR ALL
    TO authenticated
    USING (
        facility_id IS NULL 
        AND EXISTS (SELECT 1 FROM super_admins WHERE id = auth.jwt() ->> 'sub')
    )
    WITH CHECK (
        facility_id IS NULL 
        AND EXISTS (SELECT 1 FROM super_admins WHERE id = auth.jwt() ->> 'sub')
    );

-- Facility-specific FAQ: Owner can manage
CREATE POLICY "Facility owners can manage their FAQ" ON public.bot_data
    FOR ALL
    TO authenticated
    USING (
        facility_id IS NOT NULL
        AND facility_id IN (
            SELECT id FROM memorial_spaces 
            WHERE owner_user_id = auth.jwt() ->> 'sub'
        )
    )
    WITH CHECK (
        facility_id IS NOT NULL
        AND facility_id IN (
            SELECT id FROM memorial_spaces 
            WHERE owner_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Public can read all FAQ (for chatbot usage)
CREATE POLICY "Public can read bot_data" ON public.bot_data
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 5. Keep existing global FAQ row (id=1, facility_id=NULL) as fallback
-- No action needed - existing row remains
