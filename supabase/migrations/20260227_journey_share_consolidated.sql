-- ============================================================
-- Journey Share 통합 마이그레이션
-- 20260205 + 20260223 병합 + GRANT 추가 + RLS clerk_user_id() 통일
-- 2026-02-27
-- ============================================================

-- 1. user_shares 테이블
CREATE TABLE IF NOT EXISTS public.user_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  share_password TEXT NOT NULL,
  preferences TEXT[],
  contact TEXT,
  memo TEXT,
  progress_percent INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_shares_user_id ON public.user_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shares_token ON public.user_shares(share_token);

-- RLS 활성화
ALTER TABLE public.user_shares ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (clerk_user_id() 사용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_shares' AND policyname = 'shares_owner_all'
  ) THEN
    CREATE POLICY "shares_owner_all" ON public.user_shares
    FOR ALL TO authenticated
    USING (public.clerk_user_id() = user_id)
    WITH CHECK (public.clerk_user_id() = user_id);
  END IF;
END $$;

-- 2. updated_at 트리거
CREATE OR REPLACE FUNCTION public.user_shares_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_shares_set_updated_at ON public.user_shares;
CREATE TRIGGER user_shares_set_updated_at
BEFORE UPDATE ON public.user_shares
FOR EACH ROW
EXECUTE FUNCTION public.user_shares_set_updated_at();

-- 3. RPC: create_journey_share (bcrypt 비밀번호)
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
SET search_path = public
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

-- 4. RPC: get_shared_journey (bcrypt 비밀번호 검증)
CREATE OR REPLACE FUNCTION public.get_shared_journey(
  p_token TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 5. RPC: deactivate_journey_share
CREATE OR REPLACE FUNCTION public.deactivate_journey_share(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 6. GRANT
GRANT EXECUTE ON FUNCTION public.create_journey_share(TEXT[], TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_journey(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.deactivate_journey_share(TEXT) TO authenticated;
