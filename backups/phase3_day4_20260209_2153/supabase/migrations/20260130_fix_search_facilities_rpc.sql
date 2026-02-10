-- [20260130] search_facilities_by_text 오류 수정 및 통합
-- 1. 존재하지 않는 'category' 컬럼 대신 'type' 컬럼을 사용하도록 수정
-- 2. 시그니처 정합성(2인자 vs 3인자)을 위해 매개변수 기본값을 사용하여 단일 함수로 통합

-- 기존 함수들 제거 (시그니처 충돌 방지)
DROP FUNCTION IF EXISTS public.search_facilities_by_text(text, text);
DROP FUNCTION IF EXISTS public.search_facilities_by_text(text, text, int);

-- 통합된 검색 함수 정의
CREATE OR REPLACE FUNCTION public.search_facilities_by_text(
  p_text text,                  -- 검색어
  p_category text DEFAULT NULL, -- 카테고리 (필터)
  p_max_results int DEFAULT 10  -- 최대 반환 수 (기본값 10)
)
RETURNS SETOF public.facilities
LANGUAGE plpgsql
STABLE
SECURITY INVOKER  -- 실행자의 권한(RLS)을 따름
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.facilities
  WHERE
    -- 1. 이름 또는 주소 일치 검색
    (name ILIKE '%' || p_text || '%' OR address ILIKE '%' || p_text || '%')
    AND 
    -- 2. 카테고리 필터 ('category' 대신 'type' 컬럼 사용)
    (p_category IS NULL OR p_category = '' OR p_category = '전체' OR type::text = p_category)
  LIMIT p_max_results;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.search_facilities_by_text(text, text, int) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.search_facilities_by_text(text, text, int) IS '이슈 42703(column category does not exist) 및 시그니처 미스매치 통합 수정 버전';
