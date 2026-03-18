-- ============================================================
-- TICKET-E5: 공유 페이지 서버측 rate limit 추가
-- 정책: share_token + client_key(IP 우선, 없으면 User-Agent hash) 기준
-- - 60초 창에서 비밀번호 실패 5회 시 30초 잠금
-- - 서버 응답 메시지를 클라이언트와 일치시키기 위해 error 문자열을 표준화
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shared_journey_rate_limits (
  share_token TEXT NOT NULL,
  client_key TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lock_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (share_token, client_key)
);

CREATE INDEX IF NOT EXISTS idx_shared_journey_rate_limits_updated_at
  ON public.shared_journey_rate_limits(updated_at);

CREATE OR REPLACE FUNCTION public.get_shared_journey(
  p_token TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_share RECORD;
  v_headers JSONB;
  v_forwarded_for TEXT;
  v_client_ip TEXT;
  v_user_agent TEXT;
  v_client_key TEXT;
  v_failed_attempts INTEGER;
  v_window_started_at TIMESTAMPTZ;
  v_lock_until TIMESTAMPTZ;
  v_retry_after_seconds INTEGER;
  c_max_attempts CONSTANT INTEGER := 5;
  c_window_seconds CONSTANT INTEGER := 60;
  c_lock_seconds CONSTANT INTEGER := 30;
BEGIN
  v_headers := COALESCE(NULLIF(current_setting('request.headers', true), ''), '{}')::JSONB;
  v_forwarded_for := split_part(COALESCE(v_headers ->> 'x-forwarded-for', ''), ',', 1);
  v_client_ip := NULLIF(btrim(v_forwarded_for), '');
  IF v_client_ip IS NULL THEN
    v_client_ip := NULLIF(btrim(COALESCE(v_headers ->> 'x-real-ip', '')), '');
  END IF;

  v_user_agent := NULLIF(COALESCE(v_headers ->> 'user-agent', ''), '');
  v_client_key := COALESCE(
    'ip:' || v_client_ip,
    'ua:' || md5(COALESCE(v_user_agent, 'unknown')),
    'anonymous'
  );

  SELECT * INTO v_share
  FROM user_shares
  WHERE share_token = p_token
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_share IS NULL THEN
    RETURN jsonb_build_object(
      'error_code', 'NOT_FOUND',
      'error', '공유된 기록을 찾을 수 없거나 만료되었습니다.'
    );
  END IF;

  SELECT failed_attempts, window_started_at, lock_until
  INTO v_failed_attempts, v_window_started_at, v_lock_until
  FROM public.shared_journey_rate_limits
  WHERE share_token = p_token
    AND client_key = v_client_key;

  IF v_lock_until IS NOT NULL AND v_lock_until > NOW() THEN
    v_retry_after_seconds := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_lock_until - NOW())))::INTEGER);
    RETURN jsonb_build_object(
      'error_code', 'RATE_LIMITED',
      'retry_after_seconds', v_retry_after_seconds,
      'error', format('시도 횟수 초과. %s초 후 다시 시도해주세요.', v_retry_after_seconds)
    );
  END IF;

  IF v_share.share_password != crypt(p_password, v_share.share_password) THEN
    INSERT INTO public.shared_journey_rate_limits (
      share_token,
      client_key,
      failed_attempts,
      window_started_at,
      lock_until,
      updated_at
    ) VALUES (
      p_token,
      v_client_key,
      1,
      NOW(),
      NULL,
      NOW()
    )
    ON CONFLICT (share_token, client_key)
    DO UPDATE
    SET
      failed_attempts = CASE
        WHEN public.shared_journey_rate_limits.window_started_at <= NOW() - ((c_window_seconds || ' seconds')::INTERVAL) THEN 1
        ELSE public.shared_journey_rate_limits.failed_attempts + 1
      END,
      window_started_at = CASE
        WHEN public.shared_journey_rate_limits.window_started_at <= NOW() - ((c_window_seconds || ' seconds')::INTERVAL) THEN NOW()
        ELSE public.shared_journey_rate_limits.window_started_at
      END,
      lock_until = CASE
        WHEN public.shared_journey_rate_limits.window_started_at <= NOW() - ((c_window_seconds || ' seconds')::INTERVAL) THEN NULL
        WHEN public.shared_journey_rate_limits.failed_attempts + 1 >= c_max_attempts THEN NOW() + ((c_lock_seconds || ' seconds')::INTERVAL)
        ELSE NULL
      END,
      updated_at = NOW()
    RETURNING failed_attempts, window_started_at, lock_until
    INTO v_failed_attempts, v_window_started_at, v_lock_until;

    IF v_lock_until IS NOT NULL AND v_lock_until > NOW() THEN
      v_retry_after_seconds := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_lock_until - NOW())))::INTEGER);
      RETURN jsonb_build_object(
        'error_code', 'RATE_LIMITED',
        'retry_after_seconds', v_retry_after_seconds,
        'error', format('시도 횟수 초과. %s초 후 다시 시도해주세요.', v_retry_after_seconds)
      );
    END IF;

    RETURN jsonb_build_object(
      'error_code', 'INVALID_PASSWORD',
      'error', '비밀번호가 일치하지 않습니다.'
    );
  END IF;

  DELETE FROM public.shared_journey_rate_limits
  WHERE share_token = p_token
    AND client_key = v_client_key;

  UPDATE user_shares
  SET view_count = view_count + 1
  WHERE id = v_share.id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'preferences', v_share.preferences,
      'contact', v_share.contact,
      'memo', v_share.memo,
      'percent', v_share.progress_percent,
      'view_count', v_share.view_count + 1,
      'created_at', v_share.created_at
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_journey(TEXT, TEXT) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
