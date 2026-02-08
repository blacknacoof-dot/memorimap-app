-- =============================================
-- HOTFIX: Fix consultations 400 Bad Request
-- =============================================
-- Cause: RLS policy comparison between BIGINT (facilities.id) and TEXT (consultations.facility_id)
-- Solution: Cast both to TEXT in policies and use robust JWT extraction.

BEGIN;

-- 1. Ensure columns are TEXT for maximum compatibility
DO $$ 
BEGIN 
    -- user_id to TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'user_id') THEN
        ALTER TABLE public.consultations ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    END IF;

    -- facility_id to TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'facility_id') THEN
        ALTER TABLE public.consultations ALTER COLUMN facility_id TYPE TEXT USING facility_id::text;
    END IF;
END $$;

-- 2. Reset RLS Policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'consultations' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.consultations';
    END LOOP;
END $$;

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- 3. Apply Robust Policies

-- Anyone can insert (AI chat form)
CREATE POLICY "consultations_insert_public" ON public.consultations
    FOR INSERT WITH CHECK (true);

-- Users can view/modify own consultations
CREATE POLICY "consultations_owner_all" ON public.consultations
    FOR ALL TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'))
    WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- Facility admins can view consultations for their facility
-- CRITICAL FIX: Cast to TEXT for comparison
CREATE POLICY "consultations_facility_admin_select" ON public.consultations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.facilities 
            WHERE facilities.id::text = consultations.facility_id::text 
            AND (
                facilities.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
                OR 
                EXISTS (
                    SELECT 1 FROM public.facility_admins 
                    WHERE facility_id::text = facilities.id::text 
                    AND user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
                )
            )
        )
    );

-- Super admins can view all
CREATE POLICY "consultations_super_admin_all" ON public.consultations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE clerk_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
            AND role = 'super_admin'
        )
    );

-- 4. Permissions
GRANT ALL ON public.consultations TO authenticated, service_role;
GRANT SELECT ON public.consultations TO anon;

COMMIT;

SELECT 'Hotfix for consultations completed. Please test now.' as message;
