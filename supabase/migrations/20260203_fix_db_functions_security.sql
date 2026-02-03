-- Fix for 'user_favorites' type error and Linter 'search_path' warnings (Favorites Only)

-- 1. toggle_favorite
-- Drop first because return type change (SETOF user_favorites -> TABLE) requires it
DROP FUNCTION IF EXISTS public.toggle_favorite(uuid, text, integer);

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
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Mitigate search_path issues (linter)
  PERFORM set_config('search_path', 'public', true);

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_favorites
    WHERE user_id = v_user_id AND facility_id = p_facility_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN QUERY
    UPDATE public.user_favorites
    SET
      private_memo = COALESCE(p_private_memo, private_memo),
      private_rating = COALESCE(p_private_rating, private_rating),
      updated_at = NOW()
    WHERE user_id = v_user_id AND facility_id = p_facility_id
    RETURNING id, user_id, facility_id, private_memo, private_rating, created_at, updated_at;
  ELSE
    RETURN QUERY
    INSERT INTO public.user_favorites (user_id, facility_id, private_memo, private_rating)
    VALUES (v_user_id, p_facility_id, p_private_memo, p_private_rating)
    RETURNING id, user_id, facility_id, private_memo, private_rating, created_at, updated_at;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.toggle_favorite TO authenticated;

-- 2. remove_favorite
CREATE OR REPLACE FUNCTION public.remove_favorite(p_facility_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  PERFORM set_config('search_path', 'public', true);

  v_user_id := auth.uid();

  DELETE FROM public.user_favorites
  WHERE user_id = v_user_id AND facility_id = p_facility_id;

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
  facility_description TEXT,현재 찜하기(toggle_favorite) 등은 복구했으나, 엔딩노트(ending_note) 및 자동 여정 추가(journey_event)현재 찜하기(toggle_favorite) 등은 복구했으나, 엔딩노트(ending_note) 및 자동 여정 추가(journey_event)
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
  PERFORM set_config('search_path', 'public', true);

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

-- 4. analyze_favorite_patterns
DROP FUNCTION IF EXISTS public.analyze_favorite_patterns();

CREATE OR REPLACE FUNCTION public.analyze_favorite_patterns()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_analysis JSON;
BEGIN
  PERFORM set_config('search_path', 'public', true);
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
    'average_rating', ROUND(COALESCE(AVG(private_rating),0)::numeric, 1),
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
