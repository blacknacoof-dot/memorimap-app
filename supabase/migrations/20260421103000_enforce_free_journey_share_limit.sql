-- Enforce the free-plan shared journey limit on the server side.

CREATE OR REPLACE FUNCTION public.create_journey_share(
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
  v_plan_info JSONB;
  v_plan_name TEXT;
  v_active_share_count INTEGER;
BEGIN
  v_user_id := public.clerk_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', '로그인이 필요합니다.');
  END IF;

  v_plan_info := public.get_user_plan_info();
  v_plan_name := UPPER(COALESCE(v_plan_info ->> 'plan_name', 'PERSONAL_FREE'));

  IF v_plan_name = 'PERSONAL_FREE' THEN
    SELECT COUNT(*)
    INTO v_active_share_count
    FROM public.user_shares
    WHERE user_id = v_user_id
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW());

    IF COALESCE(v_active_share_count, 0) >= 1 THEN
      RETURN jsonb_build_object('error', '무료 플랜은 활성 공유 1개까지만 가능합니다.');
    END IF;
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.user_shares (
    user_id,
    share_token,
    share_password,
    preferences,
    contact,
    memo,
    progress_percent
  ) VALUES (
    v_user_id,
    v_token,
    crypt(p_password, gen_salt('bf')),
    p_preferences,
    p_contact,
    p_memo,
    p_percent
  )
  RETURNING id INTO v_share_id;

  RETURN jsonb_build_object(
    'success', true,
    'share_token', v_token,
    'share_id', v_share_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_journey_share(TEXT[], TEXT, TEXT, INTEGER, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
