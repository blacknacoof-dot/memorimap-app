-- ============================================================
-- M-2: check_and_expire_subscriptions RPC
-- 만료된 구독을 일괄 처리 (서비스 롤 / pg_cron 전용)
-- 2026-03-03
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_and_expire_subscriptions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_facility_count INT := 0;
  v_user_count     INT := 0;
BEGIN
  -- 1. facility_subscriptions: end_date 지난 active 구독 → expired
  UPDATE public.facility_subscriptions
  SET
    status     = 'expired',
    updated_at = NOW()
  WHERE
    status   = 'active'
    AND end_date IS NOT NULL
    AND end_date < NOW();

  GET DIAGNOSTICS v_facility_count = ROW_COUNT;

  -- 2. user_subscriptions: expires_at 지난 active 구독 → expired + 무료 플랜 복귀
  UPDATE public.user_subscriptions
  SET
    status    = 'expired',
    plan_id   = 'personal_free',
    plan_name = 'PERSONAL_FREE'
  WHERE
    status     = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS v_user_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'expired_facility_subscriptions', v_facility_count,
    'expired_user_subscriptions',     v_user_count,
    'checked_at',                     NOW()
  );
END;
$$;

-- service_role 전용 (슈퍼관리자 RPC 호출 / pg_cron)
REVOKE EXECUTE ON FUNCTION public.check_and_expire_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_and_expire_subscriptions() TO service_role;

NOTIFY pgrst, 'reload schema';
