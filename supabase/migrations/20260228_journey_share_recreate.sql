-- ============================================================
-- Journey Share 함수 DROP + re-CREATE
-- PostgREST 스키마 캐시 갱신을 위해 OID 변경
-- 2026-02-28
-- ============================================================

-- 1. 기존 함수 DROP (OID 변경을 위해 필수)
DROP FUNCTION IF EXISTS public.create_journey_share(TEXT[], TEXT, TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.get_shared_journey(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.deactivate_journey_share(TEXT);

-- 2. pgcrypto 확인
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 3. create_journey_share
CREATE FUNCTION public.create_journey_share(
  p_preferences TEXT[],
  p_contact TEXT,
  p_memo TEXT,
  p_percent INTEGER,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id TEXT;
  v_token TEXT;
  v_share_id UUID;
BEGIN
  v_user_id := public.clerk_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', '로그인이 필요합니다.');
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO user_shares (
    user_id, share_token, share_password,
    preferences, contact, memo, progress_percent
  ) VALUES (
    v_user_id, v_token, crypt(p_password, gen_salt('bf')),
    p_preferences, p_contact, p_memo, p_percent
  ) RETURNING id INTO v_share_id;

  RETURN jsonb_build_object(
    'success', true,
    'share_token', v_token,
    'share_id', v_share_id
  );
END;
$$;

-- 4. get_shared_journey
CREATE FUNCTION public.get_shared_journey(
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
BEGIN
  SELECT * INTO v_share
  FROM user_shares
  WHERE share_token = p_token
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_share IS NULL THEN
    RETURN jsonb_build_object('error', '공유된 기록을 찾을 수 없거나 만료되었습니다.');
  END IF;

  IF v_share.share_password != crypt(p_password, v_share.share_password) THEN
    RETURN jsonb_build_object('error', '비밀번호가 일치하지 않습니다.');
  END IF;

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

-- 5. deactivate_journey_share
CREATE FUNCTION public.deactivate_journey_share(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id TEXT;
  v_updated INTEGER;
BEGIN
  v_user_id := public.clerk_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', '로그인이 필요합니다.');
  END IF;

  UPDATE user_shares
  SET is_active = FALSE
  WHERE share_token = p_token
    AND user_id = v_user_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('error', '공유를 찾을 수 없거나 권한이 없습니다.');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6. GRANT (DROP 후 재부여 필수)
GRANT EXECUTE ON FUNCTION public.create_journey_share(TEXT[], TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_journey(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.deactivate_journey_share(TEXT) TO authenticated;

-- 7. PostgREST 스키마 캐시 리로드 시도
NOTIFY pgrst, 'reload schema';
