-- ============================================================
-- Fix: 엔딩노트 RPC 복원 + 테이블 스키마 보정
-- 20260203_cleanup에서 DROP된 함수 재생성
-- user_ending_notes 테이블에 상세 컬럼 추가
-- 2026-02-27
-- ============================================================

-- 1. user_ending_notes 테이블 상세 컬럼 추가
-- 코드(EndingNote 타입)가 요구하는 컬럼 vs DB 현재 컬럼 불일치 해소
ALTER TABLE public.user_ending_notes
  ADD COLUMN IF NOT EXISTS preferred_method TEXT[],
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
  ADD COLUMN IF NOT EXISTS final_message TEXT,
  ADD COLUMN IF NOT EXISTS photo_preference TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. RPC: get_my_ending_note()
CREATE OR REPLACE FUNCTION public.get_my_ending_note()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
  v_note RECORD;
BEGIN
  v_user_id := public.clerk_user_id();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_note
  FROM user_ending_notes
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'user_id', v_note.user_id,
    'preferred_method', v_note.preferred_method,
    'emergency_contact_name', v_note.emergency_contact_name,
    'emergency_contact_phone', v_note.emergency_contact_phone,
    'emergency_contact_relation', v_note.emergency_contact_relation,
    'final_message', v_note.final_message,
    'photo_preference', v_note.photo_preference,
    'created_at', v_note.created_at,
    'updated_at', v_note.updated_at
  );
END;
$$;

-- 3. RPC: upsert_ending_note()
CREATE OR REPLACE FUNCTION public.upsert_ending_note(
  p_preferred_method TEXT[] DEFAULT NULL,
  p_emergency_contact_name TEXT DEFAULT NULL,
  p_emergency_contact_phone TEXT DEFAULT NULL,
  p_emergency_contact_relation TEXT DEFAULT NULL,
  p_final_message TEXT DEFAULT NULL,
  p_photo_preference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
BEGIN
  v_user_id := public.clerk_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', '로그인이 필요합니다.');
  END IF;

  INSERT INTO user_ending_notes (
    user_id, preferred_method,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
    final_message, photo_preference
  ) VALUES (
    v_user_id, p_preferred_method,
    p_emergency_contact_name, p_emergency_contact_phone, p_emergency_contact_relation,
    p_final_message, p_photo_preference
  )
  ON CONFLICT (user_id) DO UPDATE SET
    preferred_method = COALESCE(EXCLUDED.preferred_method, user_ending_notes.preferred_method),
    emergency_contact_name = COALESCE(EXCLUDED.emergency_contact_name, user_ending_notes.emergency_contact_name),
    emergency_contact_phone = COALESCE(EXCLUDED.emergency_contact_phone, user_ending_notes.emergency_contact_phone),
    emergency_contact_relation = COALESCE(EXCLUDED.emergency_contact_relation, user_ending_notes.emergency_contact_relation),
    final_message = COALESCE(EXCLUDED.final_message, user_ending_notes.final_message),
    photo_preference = COALESCE(EXCLUDED.photo_preference, user_ending_notes.photo_preference);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. get_my_journey_full 업데이트 (새 컬럼 반영)
CREATE OR REPLACE FUNCTION public.get_my_journey_full()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
  v_logs JSONB;
  v_note JSONB;
BEGIN
  v_user_id := public.clerk_user_id();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 타임라인 로그 (최신순 3개)
  SELECT jsonb_agg(t) INTO v_logs FROM (
    SELECT title, description, created_at
    FROM user_journey_logs
    WHERE user_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 3
  ) t;

  -- 엔딩 노트 (새 컬럼 사용)
  SELECT jsonb_build_object(
    'preferences', COALESCE(preferred_method, preferred_types),
    'contact', COALESCE(
      CASE WHEN emergency_contact_name IS NOT NULL
        THEN emergency_contact_name || ' ' || COALESCE(emergency_contact_phone, '')
        ELSE emergency_contact
      END, ''),
    'memo', COALESCE(final_message, final_memo),
    'percent', progress_percent
  ) INTO v_note
  FROM user_ending_notes
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'timeline', COALESCE(v_logs, '[]'::jsonb),
    'ending_note', v_note
  );
END;
$$;

-- 5. GRANT
GRANT EXECUTE ON FUNCTION public.get_my_ending_note() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_ending_note(TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_journey_full() TO authenticated;
