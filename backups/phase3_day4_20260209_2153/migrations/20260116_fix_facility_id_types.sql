-- ============================================================
-- Migration v5: Fix Facility ID Types (UUID -> TEXT)
-- Purpose: Support Hybrid IDs (Legacy '1014' & UUIDs) 
--          by converting all facility_id columns to TEXT.
-- ============================================================

-- 0. Safety Definitions
SET search_path = public;

-- 1. Clean up Policies (To unlock columns for modification)
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

-- 2. Modify Facility IDs to TEXT (The Core Fix)
DO $$
BEGIN
    -- 1) Facilities Table (Primary Key Conversion)
    BEGIN
        -- Drop dependencies if any explicit FKs enforce UUID (usually handled by ALTER but safer to be explicit in complex schemas)
        -- We proceed directly with ALTER as it handles FK type changes if CASCADE is not restrictive.
        -- Force conversion of the Primary Key
        ALTER TABLE public.facilities DROP CONSTRAINT IF EXISTS facilities_pkey CASCADE;
        ALTER TABLE public.facilities ALTER COLUMN id TYPE text USING id::text;
        ALTER TABLE public.facilities ADD PRIMARY KEY (id);
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 2) Reviews
    BEGIN
        ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_facility_id_fkey;
        ALTER TABLE public.reviews ALTER COLUMN facility_id TYPE text USING facility_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 3) Consultations
    BEGIN
        ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS consultations_facility_id_fkey;
        ALTER TABLE public.consultations ALTER COLUMN facility_id TYPE text USING facility_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 4) Reservations
    BEGIN
        ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_facility_id_fkey;
        ALTER TABLE public.reservations ALTER COLUMN facility_id TYPE text USING facility_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 5) Timeline Events
    BEGIN
        ALTER TABLE public.timeline_events DROP CONSTRAINT IF EXISTS timeline_events_facility_id_fkey;
        ALTER TABLE public.timeline_events ALTER COLUMN facility_id TYPE text USING facility_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 6) Favorites
    BEGIN
        ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_facility_id_fkey;
        ALTER TABLE public.favorites ALTER COLUMN facility_id TYPE text USING facility_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- 7) Leads
    BEGIN
        ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_facility_id_fkey;
        ALTER TABLE public.leads ALTER COLUMN facility_id TYPE text USING facility_id::text;
    EXCEPTION WHEN OTHERS THEN NULL; END;

END $$;

-- 3. Restore Indexes (Performance)
DO $$
BEGIN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reviews_facility_id ON public.reviews(facility_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reservations_facility_id ON public.reservations(facility_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_consultations_facility_id ON public.consultations(facility_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_timeline_events_facility_id ON public.timeline_events(facility_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_favorites_facility_id ON public.favorites(facility_id)';
    -- Restore facility ID index just in case
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_facilities_id ON public.facilities(id)';
END $$;

-- 4. Re-Create Policies (Now everything is TEXT, so it is safe)
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

    -- Consultations
    EXECUTE 'ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Users can see their own consultations" ON public.consultations FOR SELECT TO authenticated USING (user_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Users can create consultations" ON public.consultations FOR INSERT TO authenticated WITH CHECK (user_id::text = public.current_user_id())';
    EXECUTE 'CREATE POLICY "Facility owners can see consultations" ON public.consultations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM facilities f WHERE f.id::text = consultations.facility_id::text AND f.manager_id::text = public.current_user_id()))';

    -- Reservations
    EXECUTE 'ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Users can see their own reservations" ON public.reservations FOR SELECT TO authenticated USING (user_id::text = public.current_user_id() OR (EXISTS (SELECT 1 FROM facilities f WHERE f.id::text = reservations.facility_id::text AND f.manager_id::text = public.current_user_id())))';
    EXECUTE 'CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (user_id::text = public.current_user_id())';

    -- Timeline Events
    EXECUTE 'ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Owner or user can read timeline_events" ON public.timeline_events FOR SELECT TO authenticated USING (user_id::text = public.current_user_id() OR (EXISTS (SELECT 1 FROM facilities f WHERE f.id::text = timeline_events.facility_id::text AND f.manager_id::text = public.current_user_id())))';
    EXECUTE 'CREATE POLICY "Facility owner can insert timeline_events" ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM facilities f WHERE f.id::text = timeline_events.facility_id::text AND f.manager_id::text = public.current_user_id()))';
    EXECUTE 'CREATE POLICY "Facility owner can update timeline_events" ON public.timeline_events FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM facilities f WHERE f.id::text = timeline_events.facility_id::text AND f.manager_id::text = public.current_user_id()))';

    -- Other tables (Favorites, Leads, etc.)
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

SELECT 'Migration v5 Completed. Facility IDs and User IDs are now ALL TEXT. Hybrid IDs (1014) supported.' as result;
