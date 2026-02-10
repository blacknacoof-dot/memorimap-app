-- ====================================
-- 찜 목록 조회 함수 보강 (Robust Version)
-- LEFT JOIN 사용으로 시설 정보가 없어도 목록에는 표시되도록 수정
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
    COALESCE(fac.name, '알 수 없는 시설'), -- 시설 정보 없으면 기본값
    COALESCE(fac.description, ''),
    COALESCE(fac.category, 'unknown'),
    fac.image_url,
    ST_AsText(fac.location) as location,
    f.private_memo,
    f.private_rating,
    f.created_at
  FROM public.user_favorites f
  LEFT JOIN public.facilities fac ON f.facility_id = fac.id -- LEFT JOIN으로 변경
  WHERE f.user_id = auth.uid()
  ORDER BY f.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_favorites TO authenticated;

-- 디버깅용: 내 찜 개수 확인 함수
CREATE OR REPLACE FUNCTION public.debug_my_favorites_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.user_favorites
  WHERE user_id = auth.uid();
  
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_my_favorites_count TO authenticated;
