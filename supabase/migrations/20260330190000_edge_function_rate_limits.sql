BEGIN;

CREATE TABLE IF NOT EXISTS public.edge_function_rate_limits (
  endpoint TEXT NOT NULL,
  client_key TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lock_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (endpoint, client_key)
);

CREATE INDEX IF NOT EXISTS idx_edge_function_rate_limits_updated_at
  ON public.edge_function_rate_limits(updated_at);

ALTER TABLE public.edge_function_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edge_function_rate_limits_service_insert" ON public.edge_function_rate_limits;
CREATE POLICY "edge_function_rate_limits_service_insert"
  ON public.edge_function_rate_limits
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "edge_function_rate_limits_service_select" ON public.edge_function_rate_limits;
CREATE POLICY "edge_function_rate_limits_service_select"
  ON public.edge_function_rate_limits
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS "edge_function_rate_limits_service_update" ON public.edge_function_rate_limits;
CREATE POLICY "edge_function_rate_limits_service_update"
  ON public.edge_function_rate_limits
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "edge_function_rate_limits_admin_select" ON public.edge_function_rate_limits;
CREATE POLICY "edge_function_rate_limits_admin_select"
  ON public.edge_function_rate_limits
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

COMMIT;
