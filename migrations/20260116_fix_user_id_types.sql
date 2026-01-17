-- ============================================================
-- Final Fix (v4.4): Safe Join Cast Policy
-- Purpose: Resolve "operator does not exist: uuid = text" 
--          by casting JOIN keys (id, facility_id) to ::text explicitly.
-- ============================================================

-- 0. Safety Definitions
SET search_path = public;

-- 1. Helper Functions (Ensure return type is TEXT)
CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::text;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.super_admins WHERE id::text = public.current_user_id());
EXCEPTION
  WHEN undefined_table THEN RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Clean up ALL existing policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.polname, c.relname AS tablename
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname IN ('facilities', 'reviews', 'consultations', 'favorites', 'leads', 'reservations', 'partner_inquiries', 'timeline_events', 'facility_submissions', 'notification_logs')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.polname, r.tablename);
  END LOOP;
END $$;

-- 3. Ensure Columns are TEXT (Using Force Block from v4.3)
DO $$
BEGIN
    -- Facilities
    BEGIN
        ALTER TABLE public.facilities DROP CONSTRAINT IF EXISTS facilities_manager_id_fkey;
        ALTER TABLE public.facilities ALTER COLUMN manager_id TYPE text USING manager_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Reviews
    BEGIN
        ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
        ALTER TABLE public.reviews ALTER COLUMN user_id TYPE text USING user_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Consultations
    BEGIN
        ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS consultations_user_id_fkey;
        ALTER TABLE public.consultations ALTER COLUMN user_id TYPE text USING user_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Reservations
    BEGIN
        ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;
        ALTER TABLE public.reservations ALTER COLUMN user_id TYPE text USING user_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Timeline Events
    BEGIN
        ALTER TABLE public.timeline_events DROP CONSTRAINT IF EXISTS timeline_events_user_id_fkey;
        ALTER TABLE public.timeline_events ALTER COLUMN user_id TYPE text USING user_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Favorites, Leads, etc.
    BEGIN
        ALTER TABLE public.favorites ALTER COLUMN user_id TYPE text USING user_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.leads ALTER COLUMN user_id TYPE text USING user_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.partner_inquiries ALTER COLUMN user_id TYPE text USING user_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.notification_logs ALTER COLUMN user_id TYPE text USING user_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.facility_submissions ALTER COLUMN applicant_user_id TYPE text USING applicant_user_id::text;
        ALTER TABLE public.facility_submissions ALTER COLUMN reviewed_by TYPE text USING reviewed_by::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.super_admins ALTER COLUMN id TYPE text USING id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 4. Re-Create Policies (With JOIN Key Casting ::text)
DO $$
BEGIN
    -- Facilities
    EXECUTE 'ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Public facilities are viewable by everyone" ON public.facilities FOR SELECT TO public USING (true)';
    EXECUTE 'CREATE POLICY "Enable insert for owners" ON public.facilities FOR INSERT TO authenticated WITH CHECK (manager_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Enable update for owners" ON public.facilities FOR UPDATE TO authenticated USING (manager_id::text = public.current_user_id()) WITH CHECK (manager_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Manager or Admin can delete facilities" ON public.facilities FOR DELETE TO authenticated USING (manager_id::text = public.current_user_id() OR public.is_super_admin())';

    -- Reviews
    EXECUTE 'ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT TO public USING (true)';
    EXECUTE 'CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Users can edit their own reviews" ON public.reviews FOR UPDATE TO authenticated USING (user_id::text = public.current_user_id()) WITH CHECK (user_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE TO authenticated USING (user_id::text = public.current_user_id())';

    -- Consultations (CRITICAL FIX applied here: f.id::text = consultations.facility_id::text)
    EXECUTE 'ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Users can see their own consultations" ON public.consultations FOR SELECT TO authenticated USING (user_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Users can create consultations" ON public.consultations FOR INSERT TO authenticated WITH CHECK (user_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Facility owners can see consultations" ON public.consultations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM facilities f WHERE f.id::text = consultations.facility_id::text AND f.manager_id::text = public.current_user_id()))';

    -- Reservations (Applied FIX here as well)
    EXECUTE 'ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Users can see their own reservations" ON public.reservations FOR SELECT TO authenticated USING (user_id::text = public.current_user_id() OR (EXISTS (SELECT 1 FROM facilities f WHERE f.id::text = reservations.facility_id::text AND f.manager_id::text = public.current_user_id())))';
    EXECUTE 'CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (user_id::text = public.current_user_id())';

    -- Timeline Events (Applied FIX here as well)
    EXECUTE 'ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Owner or user can read timeline_events" ON public.timeline_events FOR SELECT TO authenticated USING (user_id::text = public.current_user_id() OR (EXISTS (SELECT 1 FROM facilities f WHERE f.id::text = timeline_events.facility_id::text AND f.manager_id::text = public.current_user_id())))';
    EXECUTE 'CREATE POLICY "Facility owner can insert timeline_events" ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM facilities f WHERE f.id::text = timeline_events.facility_id::text AND f.manager_id::text = public.current_user_id()))';
    EXECUTE 'CREATE POLICY "Facility owner can update timeline_events" ON public.timeline_events FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM facilities f WHERE f.id::text = timeline_events.facility_id::text AND f.manager_id::text = public.current_user_id()))';

    -- Favorites, Leads, etc.
    EXECUTE 'ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Users can see their own favorites" ON public.favorites FOR SELECT TO authenticated USING (user_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (user_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE TO authenticated USING (user_id::text = public.current_user_id())';

    EXECUTE 'ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Users can create leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (user_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Users can see their own leads" ON public.leads FOR SELECT TO authenticated USING (user_id::text = public.current_user_id())';
    
    EXECUTE 'ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Users can read own notifications" ON public.notification_logs FOR SELECT TO authenticated USING (user_id::text = public.current_user_id())';
    
    EXECUTE 'ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Users can create inquiries" ON public.partner_inquiries FOR INSERT TO authenticated WITH CHECK (user_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Users can see own inquiries" ON public.partner_inquiries FOR SELECT TO authenticated USING (user_id::text = public.current_user_id())';
    
    EXECUTE 'ALTER TABLE public.facility_submissions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Admin or applicant can read submissions" ON public.facility_submissions FOR SELECT TO authenticated USING (applicant_user_id::text = public.current_user_id() OR public.is_super_admin())';
    EXECUTE 'CREATE POLICY "Authenticated users can submit" ON public.facility_submissions FOR INSERT TO authenticated WITH CHECK (applicant_user_id::text = public.current_user_id())';

END $$;

SELECT 'Final Fix (v4.4) Completed. Policies use Safe Join Casting (::text) to prevent UUID mismatch.' as result;

-- ============================================================
-- 5. Optional: Seed Super Admin (Uncomment and fill to execute)
-- ============================================================
/*
INSERT INTO super_admins (id, role, created_at)
VALUES 
  ('user_YOUR_CLERK_ID_HERE', 'super_admin', NOW())
ON CONFLICT (id) DO NOTHING;
*/
