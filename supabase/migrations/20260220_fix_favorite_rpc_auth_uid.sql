-- ============================================
-- FIX: 즐겨찾기 RPC 함수에서 auth.uid() → clerk_user_id() 전환
-- 문제: auth.uid()는 UUID 반환, Clerk JWT sub은 text(user_xxx) → 22P02 에러
-- 해결: profiles 테이블 통해 clerk_id → UUID 매핑 (RLS 정책과 동일 패턴)
-- Date: 2026-02-20
-- ============================================

-- 1. toggle_favorite
DROP FUNCTION IF EXISTS public.toggle_favorite(UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.toggle_favorite(
  p_facility_id UUID,
  p_private_memo TEXT DEFAULT NULL,
  p_private_rating INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  facility_id UUID,
  private_memo TEXT,
  private_rating INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Clerk JWT sub → profiles.id UUID 매핑
  SELECT p.id INTO v_user_id
  FROM profiles p
  WHERE p.clerk_id = public.clerk_user_id()
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated or profile not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_favorites
    WHERE user_favorites.user_id = v_user_id AND user_favorites.facility_id = p_facility_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN QUERY
    UPDATE public.user_favorites
    SET
      private_memo = COALESCE(p_private_memo, user_favorites.private_memo),
      private_rating = COALESCE(p_private_rating, user_favorites.private_rating),
      updated_at = NOW()
    WHERE user_favorites.user_id = v_user_id AND user_favorites.facility_id = p_facility_id
    RETURNING user_favorites.id, user_favorites.user_id, user_favorites.facility_id, user_favorites.private_memo, user_favorites.private_rating, user_favorites.created_at, user_favorites.updated_at;
  ELSE
    RETURN QUERY
    INSERT INTO public.user_favorites (user_id, facility_id, private_memo, private_rating)
    VALUES (v_user_id, p_facility_id, p_private_memo, p_private_rating)
    RETURNING user_favorites.id, user_favorites.user_id, user_favorites.facility_id, user_favorites.private_memo, user_favorites.private_rating, user_favorites.created_at, user_favorites.updated_at;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.toggle_favorite TO authenticated;

-- 2. remove_favorite
CREATE OR REPLACE FUNCTION public.remove_favorite(p_facility_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT p.id INTO v_user_id
  FROM profiles p
  WHERE p.clerk_id = public.clerk_user_id()
  LIMIT 1;

  DELETE FROM public.user_favorites
  WHERE user_favorites.user_id = v_user_id AND user_favorites.facility_id = p_facility_id;

  RETURN FOUND;
END;
$$;
GRANT EXECUTE ON FUNCTION public.remove_favorite TO authenticated;

-- 3. get_my_favorites
DROP FUNCTION IF EXISTS public.get_my_favorites();

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
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT p.id INTO v_user_id
  FROM profiles p
  WHERE p.clerk_id = public.clerk_user_id()
  LIMIT 1;

  RETURN QUERY
  SELECT
    f.id,
    f.facility_id,
    COALESCE(fac.name, '알 수 없는 시설'),
    COALESCE(fac.description, ''),
    COALESCE(fac.type::TEXT, 'unknown'),
    fac.image_url,
    ST_AsText(fac.location) as location,
    f.private_memo,
    f.private_rating,
    f.created_at
  FROM public.user_favorites f
  LEFT JOIN public.facilities fac ON f.facility_id = fac.id
  WHERE f.user_id = v_user_id
  ORDER BY f.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_favorites TO authenticated;

-- 4. analyze_favorite_patterns
DROP FUNCTION IF EXISTS public.analyze_favorite_patterns();

CREATE OR REPLACE FUNCTION public.analyze_favorite_patterns()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_analysis JSON;
BEGIN
  SELECT p.id INTO v_user_id
  FROM profiles p
  WHERE p.clerk_id = public.clerk_user_id()
  LIMIT 1;

  SELECT json_build_object(
    'total_favorites', COUNT(*),
    'most_common_category', (
      SELECT fac.type::TEXT
      FROM public.user_favorites fav
      JOIN public.facilities fac ON fav.facility_id = fac.id
      WHERE fav.user_id = v_user_id
      GROUP BY fac.type
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    'average_rating', ROUND(COALESCE(AVG(private_rating),0)::numeric, 1),
    'has_memo_count', COUNT(*) FILTER (WHERE private_memo IS NOT NULL),
    'recent_activity', (
      SELECT json_agg(json_build_object(
        'facility_name', fac.name,
        'created_at', sub.created_at
      ))
      FROM (
        SELECT fav.facility_id, fav.created_at
        FROM public.user_favorites fav
        WHERE fav.user_id = v_user_id
        ORDER BY fav.created_at DESC
        LIMIT 3
      ) sub
      JOIN public.facilities fac ON sub.facility_id = fac.id
    )
  ) INTO v_analysis
  FROM public.user_favorites
  WHERE user_id = v_user_id;

  RETURN v_analysis;
END;
$$;
GRANT EXECUTE ON FUNCTION public.analyze_favorite_patterns TO authenticated;

-- 5. debug_my_favorites_count
CREATE OR REPLACE FUNCTION public.debug_my_favorites_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  SELECT p.id INTO v_user_id
  FROM profiles p
  WHERE p.clerk_id = public.clerk_user_id()
  LIMIT 1;

  SELECT COUNT(*) INTO v_count
  FROM public.user_favorites
  WHERE user_id = v_user_id;

  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.debug_my_favorites_count TO authenticated;
