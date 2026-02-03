-- ====================================
-- 1. 찜 목록 조회 (시설 정보 포함)
-- ====================================
CREATE OR REPLACE FUNCTION public.get_my_favorites()
RETURNS TABLE (
  id UUID,
  facility_id UUID,
  facility_name TEXT,
  facility_description TEXT,
  facility_category TEXT,
  facility_image_url TEXT,
  facility_location TEXT,
  private_memo TEXT,
  private_rating INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.facility_id,
    fac.name,
    fac.description,
    fac.category,
    fac.image_url,
    ST_AsText(fac.location) as location,
    f.private_memo,
    f.private_rating,
    f.created_at
  FROM public.user_favorites f
  JOIN public.facilities fac ON f.facility_id = fac.id
  WHERE f.user_id = auth.uid()
  ORDER BY f.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_favorites TO authenticated;

-- ====================================
-- 2. 찜 추가/수정
-- ====================================
-- 리턴 타입을 테이블 구조와 동일하게 설정 (명시적)
CREATE OR REPLACE FUNCTION public.toggle_favorite(
  p_facility_id UUID,
  p_private_memo TEXT DEFAULT NULL,
  p_private_rating INTEGER DEFAULT NULL
)
RETURNS SETOF public.user_favorites
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- 이미 찜했는지 확인
  SELECT EXISTS(
    SELECT 1 FROM public.user_favorites 
    WHERE user_id = v_user_id AND facility_id = p_facility_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- 이미 찜한 경우: 메모/평점만 업데이트
    RETURN QUERY
    UPDATE public.user_favorites
    SET 
      private_memo = COALESCE(p_private_memo, private_memo),
      private_rating = COALESCE(p_private_rating, private_rating)
    WHERE user_id = v_user_id AND facility_id = p_facility_id
    RETURNING *;
  ELSE
    -- 새로 찜하기
    RETURN QUERY
    INSERT INTO public.user_favorites (user_id, facility_id, private_memo, private_rating)
    VALUES (v_user_id, p_facility_id, p_private_memo, p_private_rating)
    RETURNING *;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_favorite TO authenticated;

-- ====================================
-- 3. 찜 해제
-- ====================================
CREATE OR REPLACE FUNCTION public.remove_favorite(p_facility_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  DELETE FROM public.user_favorites
  WHERE user_id = v_user_id AND facility_id = p_facility_id;
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_favorite TO authenticated;

-- ====================================
-- 4. 엔딩 노트 조회/저장
-- ====================================
CREATE OR REPLACE FUNCTION public.upsert_ending_note(
  p_preferred_method TEXT[] DEFAULT NULL,
  p_emergency_contact_name TEXT DEFAULT NULL,
  p_emergency_contact_phone TEXT DEFAULT NULL,
  p_emergency_contact_relation TEXT DEFAULT NULL,
  p_final_message TEXT DEFAULT NULL,
  p_photo_preference TEXT DEFAULT NULL
)
RETURNS SETOF public.user_ending_note
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN QUERY
  INSERT INTO public.user_ending_note (
    user_id, 
    preferred_method, 
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relation,
    final_message,
    photo_preference
  )
  VALUES (
    v_user_id,
    p_preferred_method,
    p_emergency_contact_name,
    p_emergency_contact_phone,
    p_emergency_contact_relation,
    p_final_message,
    p_photo_preference
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    preferred_method = COALESCE(EXCLUDED.preferred_method, user_ending_note.preferred_method),
    emergency_contact_name = COALESCE(EXCLUDED.emergency_contact_name, user_ending_note.emergency_contact_name),
    emergency_contact_phone = COALESCE(EXCLUDED.emergency_contact_phone, user_ending_note.emergency_contact_phone),
    emergency_contact_relation = COALESCE(EXCLUDED.emergency_contact_relation, user_ending_note.emergency_contact_relation),
    final_message = COALESCE(EXCLUDED.final_message, user_ending_note.final_message),
    photo_preference = COALESCE(EXCLUDED.photo_preference, user_ending_note.photo_preference),
    updated_at = NOW()
  RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_ending_note TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_ending_note()
RETURNS SETOF public.user_ending_note
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.user_ending_note 
  WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_ending_note TO authenticated;

-- ====================================
-- 5. AI 분석용: 찜 목록 패턴 분석
-- ====================================
CREATE OR REPLACE FUNCTION public.analyze_favorite_patterns()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_analysis JSON;
BEGIN
  v_user_id := auth.uid();
  
  SELECT json_build_object(
    'total_favorites', COUNT(*),
    'most_common_category', (
      SELECT fac.category
      FROM public.user_favorites fav
      JOIN public.facilities fac ON fav.facility_id = fac.id
      WHERE fav.user_id = v_user_id
      GROUP BY fac.category
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    'average_rating', ROUND(AVG(private_rating)::numeric, 1),
    'has_memo_count', COUNT(*) FILTER (WHERE private_memo IS NOT NULL),
    'recent_activity', (
      SELECT json_agg(json_build_object(
        'facility_name', fac.name,
        'created_at', fav.created_at
      ))
      FROM (
        SELECT fav.facility_id, fav.created_at
        FROM public.user_favorites fav
        WHERE fav.user_id = v_user_id
        ORDER BY fav.created_at DESC
        LIMIT 3
      ) fav
      JOIN public.facilities fac ON fav.facility_id = fac.id
    )
  ) INTO v_analysis
  FROM public.user_favorites
  WHERE user_id = v_user_id;
  
  RETURN v_analysis;
END;
$$;

GRANT EXECUTE ON FUNCTION public.analyze_favorite_patterns TO authenticated;

-- ====================================
-- 6. 슈퍼관리자: 특정 사용자의 찜 목록 조회
-- ====================================
CREATE OR REPLACE FUNCTION public.admin_get_user_favorites(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  facility_id UUID,
  facility_name TEXT,
  facility_category TEXT,
  private_memo TEXT,
  private_rating INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- 관리자 권한 확인 (is_super_admin 함수 사용)
  -- 만약 is_super_admin()이 없다면 아래 주석 해제하여 직접 체크
  -- SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) INTO v_is_admin;
  
  v_is_admin := public.is_super_admin();
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    f.id,
    f.facility_id,
    fac.name,
    fac.category,
    f.private_memo,
    f.private_rating,
    f.created_at
  FROM public.user_favorites f
  JOIN public.facilities fac ON f.facility_id = fac.id
  WHERE f.user_id = p_user_id
  ORDER BY f.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_favorites TO authenticated;
