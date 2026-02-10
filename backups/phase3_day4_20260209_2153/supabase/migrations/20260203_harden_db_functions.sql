-- [20260203] Security Hardening for Database Functions
-- Resolves Supabase Linter Warning 0011: function_search_path_mutable
-- Enforces SET search_path = public and SECURITY DEFINER for security context.

-- 1. search_facilities_v2
DROP FUNCTION IF EXISTS public.search_facilities_v2(double precision, double precision, integer, text, integer);
CREATE OR REPLACE FUNCTION public.search_facilities_v2(
    lat double precision,
    lng double precision,
    radius_meters integer DEFAULT 5000,
    category text DEFAULT NULL::text,
    "limit" integer DEFAULT 20
)
RETURNS SETOF facilities
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT *
    FROM facilities
    WHERE
        latitude IS NOT NULL AND longitude IS NOT NULL
        AND (
            category IS NULL 
            OR facilities.type = search_facilities_v2.category
            OR (search_facilities_v2.category = 'memorial' AND facilities.type IN ('charnel_house', 'natural_burial', 'tree_burial', 'park_cemetery', 'complex', 'sea_burial', 'memorial', '봉안시설', '자연장', '공원묘지', '해양장'))
        )
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_meters
        )
    ORDER BY
        ST_Distance(
            ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) ASC
    LIMIT "limit";
$function$;

-- 2. search_facilities_by_text
CREATE OR REPLACE FUNCTION public.search_facilities_by_text(
  p_text text,
  p_category text DEFAULT NULL,
  p_max_results int DEFAULT 10
)
RETURNS SETOF public.facilities
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.facilities
  WHERE
    (name ILIKE '%' || p_text || '%' OR address ILIKE '%' || p_text || '%')
    AND 
    (p_category IS NULL OR p_category = '' OR p_category = '전체' OR type::text = p_category)
  LIMIT p_max_results;
END;
$$;

-- 3. toggle_favorite
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_favorites
    WHERE user_id = v_user_id AND facility_id = p_facility_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN QUERY
    UPDATE user_favorites
    SET
      private_memo = COALESCE(p_private_memo, private_memo),
      private_rating = COALESCE(p_private_rating, private_rating),
      updated_at = NOW()
    WHERE user_id = v_user_id AND facility_id = p_facility_id
    RETURNING id, user_id, facility_id, private_memo, private_rating, created_at, updated_at;
  ELSE
    RETURN QUERY
    INSERT INTO user_favorites (user_id, facility_id, private_memo, private_rating)
    VALUES (v_user_id, p_facility_id, p_private_memo, p_private_rating)
    RETURNING id, user_id, facility_id, private_memo, private_rating, created_at, updated_at;
  END IF;
END;
$$;

-- 4. remove_favorite
CREATE OR REPLACE FUNCTION public.remove_favorite(p_facility_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  DELETE FROM user_favorites
  WHERE user_id = v_user_id AND facility_id = p_facility_id;
  RETURN FOUND;
END;
$$;

-- 5. get_my_favorites
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
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.facility_id,
    COALESCE(fac.name, '알 수 없는 시설'),
    COALESCE(fac.description, ''),
    COALESCE(fac.category, 'unknown'),
    fac.image_url,
    ST_AsText(fac.location) as location,
    f.private_memo,
    f.private_rating,
    f.created_at
  FROM user_favorites f
  LEFT JOIN facilities fac ON f.facility_id = fac.id
  WHERE f.user_id = auth.uid()
  ORDER BY f.created_at DESC;
END;
$$;

-- 6. admin_get_user_favorites
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
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  v_is_admin := is_super_admin();
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
  FROM user_favorites f
  JOIN facilities fac ON f.facility_id = fac.id
  WHERE f.user_id = p_user_id
  ORDER BY f.created_at DESC;
END;
$$;

-- 7. analyze_favorite_patterns
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
  v_user_id := auth.uid();

  SELECT json_build_object(
    'total_favorites', COUNT(*),
    'most_common_category', (
      SELECT fac.category
      FROM user_favorites fav
      JOIN facilities fac ON fav.facility_id = fac.id
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
        FROM user_favorites fav
        WHERE fav.user_id = v_user_id
        ORDER BY fav.created_at DESC
        LIMIT 3
      ) fav
      JOIN facilities fac ON fav.facility_id = fac.id
    )
  ) INTO v_analysis
  FROM user_favorites
  WHERE user_id = v_user_id;

  RETURN v_analysis;
END;
$$;

-- 8. debug_my_favorites_count
CREATE OR REPLACE FUNCTION public.debug_my_favorites_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_favorites
  WHERE user_id = auth.uid();
  RETURN v_count;
END;
$$;

-- 9. create_consultation_from_lead
CREATE OR REPLACE FUNCTION public.create_consultation_from_lead(
    p_lead_id UUID,
    p_facility_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lead leads%ROWTYPE;
    v_new_consultation_id UUID;
    v_notes_text TEXT;
BEGIN
    SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found: %', p_lead_id;
    END IF;

    v_notes_text := format(
        'Lead ID: %s | Category: %s | Urgency: %s | Context: %s',
        v_lead.id,
        COALESCE(v_lead.category, 'N/A'),
        COALESCE(v_lead.urgency, 'N/A'),
        COALESCE(v_lead.context_data::TEXT, '{}')
    );

    INSERT INTO consultations (
        user_id, 
        facility_id, 
        user_name, 
        user_phone, 
        status, 
        notes
    ) VALUES (
        COALESCE(v_lead.user_id, 'anonymous'), 
        p_facility_id, 
        COALESCE(v_lead.contact_name, 'Unknown'), 
        COALESCE(v_lead.contact_phone, 'N/A'), 
        'pending', 
        v_notes_text
    )
    RETURNING id INTO v_new_consultation_id;

    UPDATE leads SET status = 'handed_over' WHERE id = p_lead_id;

    RETURN v_new_consultation_id;
END;
$$;

-- [20260203] 10. Final Security Polish (Linter Cleanup)

-- A. Harden search_facilities_by_text (Ensure SET search_path is applied)
-- (Already included in Section 2, but re-affirming here for completeness or if it was missed)
CREATE OR REPLACE FUNCTION public.search_facilities_by_text(
  p_text text,
  p_category text DEFAULT NULL,
  p_max_results int DEFAULT 10
)
RETURNS SETOF public.facilities
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.facilities
  WHERE
    (name ILIKE '%' || p_text || '%' OR address ILIKE '%' || p_text || '%')
    AND 
    (p_category IS NULL OR p_category = '' OR p_category = '전체' OR type::text = p_category)
  LIMIT p_max_results;
END;
$$;

-- B. Restrict admin_notifications RLS (Fix rls_policy_always_true)
-- Change "Anyone can insert" to restricted access for service_role or authenticated admins.
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.admin_notifications;
CREATE POLICY "Only service role can insert notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (auth.role() = 'service_role');
