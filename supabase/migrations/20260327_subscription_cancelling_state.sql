-- ============================================================
-- Subscription cancelling state machine
-- Immediate FREE downgrade -> renewal cancellation reservation
-- ============================================================

-- 1) user_subscriptions.status CHECK에 'cancelling' 추가
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_status_check
  CHECK (status::text = ANY (ARRAY['active','cancelled','expired','pending','cancelling']::text[]));

-- 2) get_user_plan_info() 수정:
-- cancelling + expires_at > now() 이면 유료 유지
-- cancelling + expires_at <= now() 이면 PERSONAL_FREE로 정리
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
  v_effective_plan_id TEXT;
  v_effective_plan_name TEXT;
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
      'status', 'active'
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
    'expires_at', v_sub.expires_at,
    'status', v_sub.status
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_plan_info() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_plan_info() TO authenticated;

-- 3) 만료된 cancelling 구독을 FREE로 정리하는 함수
CREATE OR REPLACE FUNCTION public.process_expired_subscriptions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_personal_cancelled INT := 0;
  v_facility_cancelled INT := 0;
  v_personal_expired INT := 0;
BEGIN
  -- cancelling → cancelled + FREE 전환 (해지 예약 만료)
  WITH updated AS (
    UPDATE user_subscriptions SET
      plan_id = 'PERSONAL_FREE',
      plan_name = 'PERSONAL_FREE',
      status = 'cancelled',
      auto_renew = false,
      expires_at = NULL,
      updated_at = NOW()
    WHERE status = 'cancelling'
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
    RETURNING id
  )
  SELECT count(*) INTO v_personal_cancelled FROM updated;

  WITH updated AS (
    UPDATE facility_subscriptions SET
      plan_id = 'FREE',
      status = 'cancelled',
      auto_renew = false,
      next_billing_date = NULL,
      updated_at = NOW()
    WHERE status = 'cancelling'
      AND next_billing_date IS NOT NULL
      AND next_billing_date <= NOW()
    RETURNING id
  )
  SELECT count(*) INTO v_facility_cancelled FROM updated;

  -- active → expired (자동갱신 off + 만료된 건, 별도 카운터)
  WITH updated AS (
    UPDATE user_subscriptions SET
      status = 'expired',
      auto_renew = false,
      updated_at = NOW()
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
      AND auto_renew = false
    RETURNING id
  )
  SELECT count(*) INTO v_personal_expired FROM updated;

  RETURN jsonb_build_object(
    'processed_at', NOW(),
    'personal_cancelled', v_personal_cancelled,
    'facility_cancelled', v_facility_cancelled,
    'personal_expired', v_personal_expired
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_expired_subscriptions() FROM anon, PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.process_expired_subscriptions() TO service_role;

-- 4) pg_cron 등록
-- pg_cron이 활성화된 환경에서는 기존 job을 교체하고 매일 KST 03:00에 실행한다.
-- extension이 없으면 migration은 계속 진행하고 NOTICE를 남긴다.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    EXECUTE $cron$
      DO $inner$
      DECLARE
        v_job_id bigint;
      BEGIN
        SELECT jobid INTO v_job_id
        FROM cron.job
        WHERE jobname = 'process-expired-subscriptions'
        LIMIT 1;

        IF v_job_id IS NOT NULL THEN
          PERFORM cron.unschedule(v_job_id);
        END IF;

        PERFORM cron.schedule(
          'process-expired-subscriptions',
          '0 18 * * *',
          $$SELECT public.process_expired_subscriptions()$$
        );
      END;
      $inner$
    $cron$;
  ELSE
    RAISE NOTICE 'pg_cron extension is not enabled. Enable pg_cron and run cron.schedule for process_expired_subscriptions.';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
