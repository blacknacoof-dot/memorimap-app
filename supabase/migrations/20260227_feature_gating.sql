-- ============================================================
-- Feature Gating: 유저 요금제 기능 제한 시스템
-- 2026-02-27
-- ============================================================

-- 1. 스키마 변경
-- user_subscriptions: 카테고리별 AI 카운터 + 상조 즐겨찾기 카운터
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS ai_consult_by_category JSONB
  DEFAULT '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS sangjo_favorites_count INTEGER DEFAULT 0;

-- subscription_plans.name_en UNIQUE 제약 (중복 INSERT 방지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_plans_name_en_unique'
  ) THEN
    ALTER TABLE subscription_plans
      ADD CONSTRAINT subscription_plans_name_en_unique UNIQUE (name_en);
  END IF;
END $$;

-- 2. 유저 플랜 데이터 INSERT
INSERT INTO subscription_plans (name, name_en, price, sms_quota, ai_chat_quota, features)
VALUES
  ('무료', 'PERSONAL_FREE', 0, 0, 0,
   '{"ai_consult_per_category":1,"sangjo_compare":1,"favorites":5,"ending_note":"basic","ads":true,"discount_pct":0,"family_sharing":0}'::jsonb),
  ('베이직', 'PERSONAL_BASIC', 4900, 0, 0,
   '{"ai_consult_per_category":3,"sangjo_compare":5,"favorites":20,"ending_note":"full","ads":false,"discount_pct":3,"family_sharing":0}'::jsonb),
  ('프리미엄', 'PERSONAL_PREMIUM', 9900, 0, 0,
   '{"ai_consult_per_category":-1,"sangjo_compare":-1,"favorites":-1,"ending_note":"full_pdf","ads":false,"discount_pct":5,"family_sharing":3}'::jsonb)
ON CONFLICT (name_en) DO NOTHING;

-- 3. RPC: get_user_plan_info()
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
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_month_start := date_trunc('month', NOW() AT TIME ZONE 'Asia/Seoul');

  -- 행 조회 (없으면 personal_free 자동 생성)
  SELECT * INTO v_sub
  FROM user_subscriptions
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (
      user_id, plan_name, status, ai_consult_used, sangjo_compare_used,
      favorites_count, sangjo_favorites_count, ai_consult_by_category, last_reset_at
    ) VALUES (
      v_user_id, 'personal_free', 'active', 0, 0,
      0, 0, '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb, v_month_start
    )
    RETURNING * INTO v_sub;
  END IF;

  -- Lazy monthly reset
  IF v_sub.last_reset_at < v_month_start THEN
    UPDATE user_subscriptions SET
      ai_consult_used = 0,
      sangjo_compare_used = 0,
      ai_consult_by_category = '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb,
      last_reset_at = v_month_start
    WHERE user_id = v_user_id
    RETURNING * INTO v_sub;
  END IF;

  -- 플랜 한도 조회
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE name_en = UPPER(COALESCE(v_sub.plan_name, 'personal_free'));

  IF NOT FOUND THEN
    -- fallback: PERSONAL_FREE
    SELECT * INTO v_plan
    FROM subscription_plans
    WHERE name_en = 'PERSONAL_FREE';
  END IF;

  v_limits := COALESCE(v_plan.features, '{}'::jsonb);

  RETURN jsonb_build_object(
    'plan_id', COALESCE(v_plan.id::text, ''),
    'plan_name', COALESCE(v_sub.plan_name, 'personal_free'),
    'ai_consult_by_category', COALESCE(v_sub.ai_consult_by_category, '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb),
    'sangjo_compare_used', COALESCE(v_sub.sangjo_compare_used, 0),
    'favorites_count', COALESCE(v_sub.favorites_count, 0),
    'sangjo_favorites_count', COALESCE(v_sub.sangjo_favorites_count, 0),
    'limits', v_limits,
    'expires_at', v_sub.expires_at
  );
END;
$$;

-- 4. RPC: check_and_increment_user_quota(p_quota_type, p_category)
CREATE OR REPLACE FUNCTION public.check_and_increment_user_quota(
  p_quota_type TEXT,
  p_category TEXT DEFAULT NULL
)
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
  v_current INT;
  v_limit INT;
  v_month_start TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_month_start := date_trunc('month', NOW() AT TIME ZONE 'Asia/Seoul');

  -- FOR UPDATE 잠금
  SELECT * INTO v_sub
  FROM user_subscriptions
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (
      user_id, plan_name, status, ai_consult_used, sangjo_compare_used,
      favorites_count, sangjo_favorites_count, ai_consult_by_category, last_reset_at
    ) VALUES (
      v_user_id, 'personal_free', 'active', 0, 0,
      0, 0, '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb, v_month_start
    )
    RETURNING * INTO v_sub;
  END IF;

  -- Lazy monthly reset (월간 카운터만, 즐겨찾기는 리셋 안 함)
  IF v_sub.last_reset_at < v_month_start THEN
    UPDATE user_subscriptions SET
      ai_consult_used = 0,
      sangjo_compare_used = 0,
      ai_consult_by_category = '{"funeral_home":0,"memorial_facility":0,"pet_funeral":0}'::jsonb,
      last_reset_at = v_month_start
    WHERE user_id = v_user_id
    RETURNING * INTO v_sub;
  END IF;

  -- 플랜 한도
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE name_en = UPPER(COALESCE(v_sub.plan_name, 'personal_free'));

  IF NOT FOUND THEN
    SELECT * INTO v_plan FROM subscription_plans WHERE name_en = 'PERSONAL_FREE';
  END IF;

  v_limits := COALESCE(v_plan.features, '{}'::jsonb);

  -- 타입별 체크 & 증가
  CASE p_quota_type
    WHEN 'ai_consult' THEN
      IF p_category IS NULL THEN
        RAISE EXCEPTION 'ai_consult requires p_category';
      END IF;
      v_current := COALESCE((v_sub.ai_consult_by_category ->> p_category)::int, 0);
      v_limit := COALESCE((v_limits ->> 'ai_consult_per_category')::int, 1);

      IF v_limit != -1 AND v_current >= v_limit THEN
        RETURN jsonb_build_object('allowed', false, 'current', v_current, 'limit', v_limit);
      END IF;

      UPDATE user_subscriptions SET
        ai_consult_by_category = jsonb_set(
          COALESCE(ai_consult_by_category, '{}'::jsonb),
          ARRAY[p_category],
          to_jsonb(v_current + 1)
        ),
        ai_consult_used = COALESCE(ai_consult_used, 0) + 1
      WHERE user_id = v_user_id;

      RETURN jsonb_build_object('allowed', true, 'current', v_current + 1, 'limit', v_limit);

    WHEN 'sangjo_compare' THEN
      v_current := COALESCE(v_sub.sangjo_compare_used, 0);
      v_limit := COALESCE((v_limits ->> 'sangjo_compare')::int, 1);

      IF v_limit != -1 AND v_current >= v_limit THEN
        RETURN jsonb_build_object('allowed', false, 'current', v_current, 'limit', v_limit);
      END IF;

      UPDATE user_subscriptions SET
        sangjo_compare_used = v_current + 1
      WHERE user_id = v_user_id;

      RETURN jsonb_build_object('allowed', true, 'current', v_current + 1, 'limit', v_limit);

    WHEN 'favorite' THEN
      v_current := COALESCE(v_sub.favorites_count, 0) + COALESCE(v_sub.sangjo_favorites_count, 0);
      v_limit := COALESCE((v_limits ->> 'favorites')::int, 5);

      IF v_limit != -1 AND v_current >= v_limit THEN
        RETURN jsonb_build_object('allowed', false, 'current', v_current, 'limit', v_limit);
      END IF;

      IF p_category = 'sangjo' THEN
        UPDATE user_subscriptions SET
          sangjo_favorites_count = COALESCE(sangjo_favorites_count, 0) + 1
        WHERE user_id = v_user_id;
      ELSE
        UPDATE user_subscriptions SET
          favorites_count = COALESCE(favorites_count, 0) + 1
        WHERE user_id = v_user_id;
      END IF;

      RETURN jsonb_build_object('allowed', true, 'current', v_current + 1, 'limit', v_limit);

    ELSE
      RAISE EXCEPTION 'Unknown quota type: %', p_quota_type;
  END CASE;
END;
$$;

-- 5. RPC: decrement_user_favorites_count(p_is_sangjo)
CREATE OR REPLACE FUNCTION public.decrement_user_favorites_count(
  p_is_sangjo BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := public.clerk_user_id();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_is_sangjo THEN
    UPDATE user_subscriptions SET
      sangjo_favorites_count = GREATEST(COALESCE(sangjo_favorites_count, 0) - 1, 0)
    WHERE user_id = v_user_id;
  ELSE
    UPDATE user_subscriptions SET
      favorites_count = GREATEST(COALESCE(favorites_count, 0) - 1, 0)
    WHERE user_id = v_user_id;
  END IF;
END;
$$;

-- 6. RPC: check_and_increment_facility_quota(p_facility_id, p_quota_type)
CREATE OR REPLACE FUNCTION public.check_and_increment_facility_quota(
  p_facility_id UUID,
  p_quota_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_plan RECORD;
  v_current INT;
  v_limit INT;
  v_month_start TIMESTAMPTZ;
BEGIN
  v_month_start := date_trunc('month', NOW() AT TIME ZONE 'Asia/Seoul');

  SELECT * INTO v_sub
  FROM facility_subscriptions
  WHERE facility_id = p_facility_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'current', 0, 'limit', -1);
  END IF;

  -- Lazy monthly reset
  IF v_sub.last_reset_at < v_month_start THEN
    UPDATE facility_subscriptions SET
      ai_chat_used = 0,
      sms_used = 0,
      last_reset_at = v_month_start
    WHERE facility_id = p_facility_id
    RETURNING * INTO v_sub;
  END IF;

  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_sub.plan_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'current', 0, 'limit', -1);
  END IF;

  CASE p_quota_type
    WHEN 'ai_chat' THEN
      v_current := COALESCE(v_sub.ai_chat_used, 0);
      v_limit := COALESCE(v_plan.ai_chat_quota, -1);

      IF v_limit != -1 AND v_current >= v_limit THEN
        RETURN jsonb_build_object('allowed', false, 'current', v_current, 'limit', v_limit);
      END IF;

      UPDATE facility_subscriptions SET
        ai_chat_used = v_current + 1
      WHERE facility_id = p_facility_id;

      RETURN jsonb_build_object('allowed', true, 'current', v_current + 1, 'limit', v_limit);

    WHEN 'sms' THEN
      v_current := COALESCE(v_sub.sms_used, 0);
      v_limit := COALESCE(v_plan.sms_quota, -1);

      IF v_limit != -1 AND v_current >= v_limit THEN
        RETURN jsonb_build_object('allowed', false, 'current', v_current, 'limit', v_limit);
      END IF;

      UPDATE facility_subscriptions SET
        sms_used = v_current + 1
      WHERE facility_id = p_facility_id;

      RETURN jsonb_build_object('allowed', true, 'current', v_current + 1, 'limit', v_limit);

    ELSE
      RAISE EXCEPTION 'Unknown facility quota type: %', p_quota_type;
  END CASE;
END;
$$;

-- 7. GRANT
GRANT EXECUTE ON FUNCTION public.get_user_plan_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_user_quota(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_user_favorites_count(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_facility_quota(UUID, TEXT) TO authenticated;
