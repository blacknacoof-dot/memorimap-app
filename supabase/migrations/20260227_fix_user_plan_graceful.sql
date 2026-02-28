-- ============================================================
-- Fix: get_user_plan_info RAISE EXCEPTION → graceful default return
-- + plan_name 대문자 통일 (CHECK 제약 조건 준수)
-- 2026-02-27
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_plan_info()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := public.clerk_user_id();
  v_sub RECORD;
  v_plan RECORD;
  v_limits JSONB;
  v_month_start TIMESTAMPTZ;
BEGIN
  -- 인증 안 된 경우 기본 무료 플랜 반환 (RAISE EXCEPTION 대신)
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'plan_id', 'personal_free',
      'plan_name', 'PERSONAL_FREE',
      'ai_consult_by_category', '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb,
      'sangjo_compare_used', 0,
      'favorites_count', 0,
      'sangjo_favorites_count', 0,
      'limits', '{}'::jsonb,
      'expires_at', NULL
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

  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE name_en = COALESCE(v_sub.plan_name, 'PERSONAL_FREE');

  IF NOT FOUND THEN
    SELECT * INTO v_plan
    FROM subscription_plans
    WHERE name_en = 'PERSONAL_FREE';
  END IF;

  v_limits := COALESCE(v_plan.features, '{}'::jsonb);

  RETURN jsonb_build_object(
    'plan_id', COALESCE(v_sub.plan_id, 'personal_free'),
    'plan_name', COALESCE(v_sub.plan_name, 'PERSONAL_FREE'),
    'ai_consult_by_category', COALESCE(v_sub.ai_consult_by_category, '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb),
    'sangjo_compare_used', COALESCE(v_sub.sangjo_compare_used, 0),
    'favorites_count', COALESCE(v_sub.favorites_count, 0),
    'sangjo_favorites_count', COALESCE(v_sub.sangjo_favorites_count, 0),
    'limits', v_limits,
    'expires_at', v_sub.expires_at
  );
END;
$$;

-- GRANT
REVOKE EXECUTE ON FUNCTION public.get_user_plan_info() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_plan_info() TO authenticated;

NOTIFY pgrst, 'reload schema';
