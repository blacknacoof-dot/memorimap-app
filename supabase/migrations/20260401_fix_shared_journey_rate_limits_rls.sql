BEGIN;

ALTER TABLE IF EXISTS public.shared_journey_rate_limits
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shared_journey_rate_limits_service_insert" ON public.shared_journey_rate_limits;
CREATE POLICY "shared_journey_rate_limits_service_insert"
  ON public.shared_journey_rate_limits
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "shared_journey_rate_limits_service_select" ON public.shared_journey_rate_limits;
CREATE POLICY "shared_journey_rate_limits_service_select"
  ON public.shared_journey_rate_limits
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "shared_journey_rate_limits_service_update" ON public.shared_journey_rate_limits;
CREATE POLICY "shared_journey_rate_limits_service_update"
  ON public.shared_journey_rate_limits
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "shared_journey_rate_limits_service_delete" ON public.shared_journey_rate_limits;
CREATE POLICY "shared_journey_rate_limits_service_delete"
  ON public.shared_journey_rate_limits
  FOR DELETE
  TO service_role
  USING (true);

COMMIT;
