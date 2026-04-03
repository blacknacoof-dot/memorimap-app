-- ============================================================
-- Fix AI consult quota RPC plan normalization
-- 1. user_subscriptions default plan_id/plan_name -> PERSONAL_FREE
-- 2. facility_subscriptions.plan_id is canonical name_en (FREE/PREMIUM/...)
--    but the RPC was incorrectly resolving it via subscription_plans.id
-- ============================================================

-- Normalize legacy lowercase personal plan ids.
UPDATE public.user_subscriptions
SET plan_id = UPPER(plan_id)
WHERE plan_id IN ('personal_free', 'personal_basic', 'personal_premium');

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_consult_quotas(
  p_facility_id UUID,
  p_category TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := public.clerk_user_id();
  v_user_sub RECORD;
  v_user_plan RECORD;
  v_user_limits JSONB;
  v_user_current INT;
  v_user_limit INT;

  v_facility_sub RECORD;
  v_facility_plan RECORD;
  v_facility_current INT := 0;
  v_facility_limit INT := -1;
  v_has_facility_subscription BOOLEAN := FALSE;
  v_has_facility_plan BOOLEAN := FALSE;

  v_month_start TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_category IS NULL THEN
    RAISE EXCEPTION 'ai_consult requires p_category';
  END IF;

  v_month_start := date_trunc('month', NOW() AT TIME ZONE 'Asia/Seoul');

  INSERT INTO user_subscriptions (
    user_id, plan_id, plan_name, status, ai_consult_used, sangjo_compare_used,
    favorites_count, sangjo_favorites_count, ai_consult_by_category, last_reset_at
  ) VALUES (
    v_user_id, 'PERSONAL_FREE', 'PERSONAL_FREE', 'active', 0, 0,
    0, 0, '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb, v_month_start
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_user_sub
  FROM user_subscriptions
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF COALESCE(v_user_sub.last_reset_at, '-infinity'::timestamptz) < v_month_start THEN
    UPDATE user_subscriptions SET
      ai_consult_used = 0,
      sangjo_compare_used = 0,
      ai_consult_by_category = '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb,
      last_reset_at = v_month_start
    WHERE user_id = v_user_id
    RETURNING * INTO v_user_sub;
  END IF;

  SELECT * INTO v_user_plan
  FROM subscription_plans
  WHERE name_en = COALESCE(v_user_sub.plan_name, 'PERSONAL_FREE');

  IF NOT FOUND THEN
    SELECT * INTO v_user_plan
    FROM subscription_plans
    WHERE name_en = 'PERSONAL_FREE';
  END IF;

  v_user_limits := COALESCE(v_user_plan.features, '{}'::jsonb);
  v_user_current := COALESCE((v_user_sub.ai_consult_by_category ->> p_category)::int, 0);
  v_user_limit := COALESCE((v_user_limits ->> 'ai_consult_per_category')::int, 1);

  SELECT * INTO v_facility_sub
  FROM facility_subscriptions
  WHERE facility_id = p_facility_id
  FOR UPDATE;

  IF FOUND THEN
    v_has_facility_subscription := TRUE;

    IF COALESCE(v_facility_sub.last_reset_at, '-infinity'::timestamptz) < v_month_start THEN
      UPDATE facility_subscriptions SET
        ai_chat_used = 0,
        sms_used = 0,
        last_reset_at = v_month_start
      WHERE facility_id = p_facility_id
      RETURNING * INTO v_facility_sub;
    END IF;

    SELECT * INTO v_facility_plan
    FROM subscription_plans
    WHERE name_en = UPPER(COALESCE(v_facility_sub.plan_id, ''))
       OR id::text = v_facility_sub.plan_id
    ORDER BY CASE
      WHEN name_en = UPPER(COALESCE(v_facility_sub.plan_id, '')) THEN 0
      ELSE 1
    END
    LIMIT 1;

    IF FOUND THEN
      v_has_facility_plan := TRUE;
      v_facility_current := COALESCE(v_facility_sub.ai_chat_used, 0);
      v_facility_limit := COALESCE(v_facility_plan.ai_chat_quota, -1);
    END IF;
  END IF;

  IF v_user_limit != -1 AND v_user_current >= v_user_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'current', v_user_current,
      'limit', v_user_limit,
      'reason', 'user_limit',
      'user_current', v_user_current,
      'user_limit', v_user_limit,
      'facility_current', v_facility_current,
      'facility_limit', v_facility_limit
    );
  END IF;

  IF v_facility_limit != -1 AND v_facility_current >= v_facility_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'current', v_facility_current,
      'limit', v_facility_limit,
      'reason', 'facility_limit',
      'user_current', v_user_current,
      'user_limit', v_user_limit,
      'facility_current', v_facility_current,
      'facility_limit', v_facility_limit
    );
  END IF;

  UPDATE user_subscriptions SET
    ai_consult_by_category = jsonb_set(
      COALESCE(ai_consult_by_category, '{}'::jsonb),
      ARRAY[p_category],
      to_jsonb(v_user_current + 1)
    ),
    ai_consult_used = COALESCE(ai_consult_used, 0) + 1
  WHERE user_id = v_user_id;

  IF v_has_facility_subscription AND v_has_facility_plan THEN
    UPDATE facility_subscriptions SET
      ai_chat_used = v_facility_current + 1
    WHERE facility_id = p_facility_id;
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'current', v_user_current + 1,
    'limit', v_user_limit,
    'reason', NULL,
    'user_current', v_user_current + 1,
    'user_limit', v_user_limit,
    'facility_current', CASE
      WHEN v_has_facility_subscription AND v_has_facility_plan THEN v_facility_current + 1
      ELSE v_facility_current
    END,
    'facility_limit', v_facility_limit
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_consult_quotas(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
