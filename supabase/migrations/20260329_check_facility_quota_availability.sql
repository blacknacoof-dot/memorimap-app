-- 시설 쿼터 가용성 확인 (읽기 전용, increment 없음)
-- 목적: 사용자 쿼터를 차감하기 전에 시설 쿼터 가용 여부를 먼저 확인
-- 이번 수정은 피해 우선순위를 고려해 사용자 선소모 문제를 막는 임시 완화다.
-- 최종적으로는 사용자/시설 쿼터를 단일 RPC 트랜잭션으로 통합해야 한다.

CREATE OR REPLACE FUNCTION public.check_facility_quota_availability(
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
  WHERE facility_id = p_facility_id;

  -- 구독 없으면 무제한 허용 (기존 check_and_increment_facility_quota와 동일)
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'current', 0, 'limit', -1);
  END IF;

  -- 월간 리셋 판정 (읽기 전용이므로 실제 UPDATE 없이 값만 보정)
  IF v_sub.last_reset_at < v_month_start THEN
    v_sub.ai_chat_used := 0;
    v_sub.sms_used := 0;
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
    WHEN 'sms' THEN
      v_current := COALESCE(v_sub.sms_used, 0);
      v_limit := COALESCE(v_plan.sms_quota, -1);
    ELSE
      RAISE EXCEPTION 'Unknown facility quota type: %', p_quota_type;
  END CASE;

  IF v_limit != -1 AND v_current >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'current', v_current, 'limit', v_limit);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'current', v_current, 'limit', v_limit);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_facility_quota_availability(UUID, TEXT) TO authenticated;
