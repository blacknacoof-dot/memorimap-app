BEGIN;

CREATE TABLE IF NOT EXISTS public.premium_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_tier text NOT NULL DEFAULT 'premium',
  premium_status text NOT NULL DEFAULT 'active',
  premium_source text NOT NULL,
  premium_granted_at timestamptz NOT NULL DEFAULT now(),
  premium_expires_at timestamptz,
  granted_by_admin_id uuid,
  notes text,
  revoked_at timestamptz,
  revoked_by_admin_id uuid,
  revoke_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT premium_grants_status_check
    CHECK (premium_status IN ('active', 'expired', 'revoked')),
  CONSTRAINT premium_grants_source_check
    CHECK (premium_source IN ('beta_manual', 'beta_coupon', 'beta_invite', 'cs_comp', 'partner_test')),
  CONSTRAINT premium_grants_plan_tier_check
    CHECK (plan_tier = 'premium'),
  CONSTRAINT premium_grants_expiry_after_grant_check
    CHECK (premium_expires_at IS NULL OR premium_expires_at > premium_granted_at),
  CONSTRAINT premium_grants_revoked_fields_check
    CHECK (
      premium_status <> 'revoked'
      OR (revoked_at IS NOT NULL AND revoke_reason IS NOT NULL)
    ),
  CONSTRAINT premium_grants_user_fk
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT premium_grants_granted_by_fk
    FOREIGN KEY (granted_by_admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT premium_grants_revoked_by_fk
    FOREIGN KEY (revoked_by_admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_premium_grants_user_id
  ON public.premium_grants(user_id);

CREATE INDEX IF NOT EXISTS idx_premium_grants_status
  ON public.premium_grants(premium_status);

CREATE INDEX IF NOT EXISTS idx_premium_grants_expires_at
  ON public.premium_grants(premium_expires_at);

CREATE INDEX IF NOT EXISTS idx_premium_grants_user_status_expires
  ON public.premium_grants(user_id, premium_status, premium_expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_premium_grants_one_active_per_user
  ON public.premium_grants(user_id)
  WHERE premium_status = 'active';

CREATE OR REPLACE FUNCTION public.touch_premium_grants_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_premium_grants_set_updated_at ON public.premium_grants;
CREATE TRIGGER trigger_premium_grants_set_updated_at
BEFORE UPDATE ON public.premium_grants
FOR EACH ROW
EXECUTE FUNCTION public.touch_premium_grants_updated_at();

ALTER TABLE public.premium_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "premium_grants_select_own_or_super_admin" ON public.premium_grants;
CREATE POLICY "premium_grants_select_own_or_super_admin"
ON public.premium_grants
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR user_id = auth.uid()
  OR user_id::text = public.clerk_user_id()
);

DROP POLICY IF EXISTS "premium_grants_super_admin_insert" ON public.premium_grants;
CREATE POLICY "premium_grants_super_admin_insert"
ON public.premium_grants
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "premium_grants_super_admin_update" ON public.premium_grants;
CREATE POLICY "premium_grants_super_admin_update"
ON public.premium_grants
FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

REVOKE ALL ON public.premium_grants FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.premium_grants TO authenticated;
GRANT ALL ON public.premium_grants TO service_role;

CREATE OR REPLACE FUNCTION public.get_active_premium_grant(p_target_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  id uuid,
  user_id uuid,
  plan_tier text,
  premium_status text,
  premium_source text,
  premium_granted_at timestamptz,
  premium_expires_at timestamptz,
  granted_by_admin_id uuid,
  notes text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pg.id,
    pg.user_id,
    pg.plan_tier,
    pg.premium_status,
    pg.premium_source,
    pg.premium_granted_at,
    pg.premium_expires_at,
    pg.granted_by_admin_id,
    pg.notes
  FROM public.premium_grants pg
  WHERE pg.user_id = p_target_user_id
    AND pg.premium_status = 'active'
    AND (pg.premium_expires_at IS NULL OR pg.premium_expires_at > now())
  ORDER BY pg.premium_granted_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_active_premium_grant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_active_premium_grant(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_premium_expiring_targets(p_days integer)
RETURNS TABLE (
  user_id uuid,
  grant_id uuid,
  premium_expires_at timestamptz,
  premium_source text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pg.user_id,
    pg.id AS grant_id,
    pg.premium_expires_at,
    pg.premium_source
  FROM public.premium_grants pg
  WHERE pg.premium_status = 'active'
    AND pg.premium_expires_at IS NOT NULL
    AND pg.premium_expires_at > now()
    AND pg.premium_expires_at <= now() + make_interval(days => GREATEST(p_days, 0));
$$;

REVOKE ALL ON FUNCTION public.get_premium_expiring_targets(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_premium_expiring_targets(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.process_expired_premium_grants()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count int := 0;
BEGIN
  WITH updated AS (
    UPDATE public.premium_grants
    SET
      premium_status = 'expired',
      updated_at = now()
    WHERE premium_status = 'active'
      AND premium_expires_at IS NOT NULL
      AND premium_expires_at <= now()
    RETURNING id
  )
  SELECT count(*) INTO v_expired_count FROM updated;

  RETURN jsonb_build_object(
    'processed_at', now(),
    'expired_count', v_expired_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_expired_premium_grants() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_expired_premium_grants() TO service_role;

CREATE OR REPLACE FUNCTION public.get_user_plan_info()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := public.clerk_user_id();
  v_auth_uid uuid := auth.uid();
  v_sub RECORD;
  v_plan RECORD;
  v_limits JSONB;
  v_month_start TIMESTAMPTZ;
  v_effective_plan_id TEXT;
  v_effective_plan_name TEXT;
  v_premium_override RECORD;
  v_enable_premium_grants_override BOOLEAN := true;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'plan_id', 'personal_free',
      'plan_name', 'PERSONAL_FREE',
      'ai_consult_by_category', '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb,
      'sangjo_compare_used', 0,
      'favorites_count', 0,
      'sangjo_favorites_count', 0,
      'limits', '{}'::jsonb,
      'expires_at', NULL,
      'status', 'active',
      'premium_source', NULL,
      'is_beta_premium', false
    );
  END IF;

  v_month_start := date_trunc('month', NOW() AT TIME ZONE 'Asia/Seoul');

  SELECT * INTO v_sub
  FROM user_subscriptions
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (
      user_id, plan_id, plan_name, status, ai_consult_used, sangjo_compare_used,
      favorites_count, sangjo_favorites_count, ai_consult_by_category, last_reset_at
    ) VALUES (
      v_user_id, 'personal_free', 'PERSONAL_FREE', 'active', 0, 0,
      0, 0, '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb, v_month_start
    )
    RETURNING * INTO v_sub;
  END IF;

  IF v_sub.last_reset_at < v_month_start THEN
    UPDATE user_subscriptions SET
      ai_consult_used = 0,
      sangjo_compare_used = 0,
      ai_consult_by_category = '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb,
      last_reset_at = v_month_start
    WHERE user_id = v_user_id
    RETURNING * INTO v_sub;
  END IF;

  IF v_sub.status = 'cancelling' AND v_sub.expires_at IS NOT NULL AND v_sub.expires_at <= NOW() THEN
    UPDATE user_subscriptions SET
      plan_id = 'PERSONAL_FREE',
      plan_name = 'PERSONAL_FREE',
      status = 'cancelled',
      auto_renew = false,
      expires_at = NULL
    WHERE user_id = v_user_id
    RETURNING * INTO v_sub;
  END IF;

  v_effective_plan_id := COALESCE(v_sub.plan_id, 'personal_free');
  v_effective_plan_name := COALESCE(v_sub.plan_name, 'PERSONAL_FREE');

  IF v_enable_premium_grants_override AND v_auth_uid IS NOT NULL THEN
    SELECT *
    INTO v_premium_override
    FROM public.get_active_premium_grant(v_auth_uid);

    IF FOUND THEN
      v_effective_plan_id := 'beta_premium';
      v_effective_plan_name := 'PERSONAL_PREMIUM';
    END IF;
  END IF;

  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE name_en = v_effective_plan_name;

  IF NOT FOUND THEN
    SELECT * INTO v_plan
    FROM subscription_plans
    WHERE name_en = 'PERSONAL_FREE';
  END IF;

  v_limits := COALESCE(v_plan.features, '{}'::jsonb);

  RETURN jsonb_build_object(
    'plan_id', v_effective_plan_id,
    'plan_name', v_effective_plan_name,
    'ai_consult_by_category', COALESCE(v_sub.ai_consult_by_category, '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb),
    'sangjo_compare_used', COALESCE(v_sub.sangjo_compare_used, 0),
    'favorites_count', COALESCE(v_sub.favorites_count, 0),
    'sangjo_favorites_count', COALESCE(v_sub.sangjo_favorites_count, 0),
    'limits', v_limits,
    'expires_at', COALESCE(v_premium_override.premium_expires_at, v_sub.expires_at),
    'status', CASE
      WHEN v_premium_override.id IS NOT NULL THEN 'active'
      ELSE v_sub.status
    END,
    'premium_source', v_premium_override.premium_source,
    'is_beta_premium', (v_premium_override.id IS NOT NULL)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_plan_info() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_plan_info() TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-expired-premium-grants') THEN
      PERFORM cron.unschedule((SELECT jobid FROM cron.job WHERE jobname = 'process-expired-premium-grants' LIMIT 1));
    END IF;

    PERFORM cron.schedule(
      'process-expired-premium-grants',
      '5 18 * * *',
      'SELECT public.process_expired_premium_grants()'
    );
  ELSE
    RAISE NOTICE 'pg_cron extension is not enabled. Enable pg_cron and run cron.schedule for process_expired_premium_grants.';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
