-- strict_rls.sql
-- [User Provided Fix: Explicit Text Casting]
-- Resolves 'text = uuid' error by strictly casting auth.uid() and facilities.id to text.

-- Remove previous policies
DROP POLICY IF EXISTS "Users can view own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can insert own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can update own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Facility Admins can view facility consultations" ON public.consultations;
DROP POLICY IF EXISTS "Facility Admins can update facility consultations" ON public.consultations;

-- Enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- User policies (consultations.user_id is text)
CREATE POLICY "Users can view own consultations"
  ON public.consultations
  FOR SELECT
  TO authenticated
  USING ( public.consultations.user_id = (SELECT auth.uid())::text );

CREATE POLICY "Users can insert own consultations"
  ON public.consultations
  FOR INSERT
  TO authenticated
  WITH CHECK ( public.consultations.user_id = (SELECT auth.uid())::text );

CREATE POLICY "Users can update own consultations"
  ON public.consultations
  FOR UPDATE
  TO authenticated
  USING ( public.consultations.user_id = (SELECT auth.uid())::text )
  WITH CHECK ( public.consultations.user_id = (SELECT auth.uid())::text );

-- Facility admin policies (facilities.id is uuid, consultations.facility_id is text)
CREATE POLICY "Facility Admins can view facility consultations"
  ON public.consultations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id::text = public.consultations.facility_id
        AND f.user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY "Facility Admins can update facility consultations"
  ON public.consultations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id::text = public.consultations.facility_id
        AND f.user_id = (SELECT auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id::text = public.consultations.facility_id
        AND f.user_id = (SELECT auth.uid())::text
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_facilities_user_id ON public.facilities(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_facility_id_text ON public.consultations(facility_id);
