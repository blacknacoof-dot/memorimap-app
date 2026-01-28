-- [Review System Unification V3.4] facility_reviews 테이블 통합 마이그레이션 (최종본)
-- 수정: RLS 정책을 먼저 삭제한 후 타입 변경

BEGIN;

-- ===== 0단계: RLS 정책 먼저 삭제 (타입 변경을 위해) =====

DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Public can view" ON public.facility_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.facility_reviews;
DROP POLICY IF EXISTS "Authenticated can insert" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can soft delete own reviews" ON public.facility_reviews;

-- ===== 1단계: 제약 조건 삭제 =====

-- 외래 키 삭제 (memorial_spaces.id 가 bigint라 TEXT 전환을 방해함)
ALTER TABLE public.facility_reviews 
  DROP CONSTRAINT IF EXISTS facility_reviews_facility_id_fkey;

-- UNIQUE 제약 조건 임시 삭제
ALTER TABLE public.facility_reviews 
  DROP CONSTRAINT IF EXISTS facility_reviews_facility_id_user_id_source_key;

-- 기존 인덱스도 삭제 (있다면)
DROP INDEX IF EXISTS idx_reviews_one_per_user;

-- ===== 2단계: 컬럼 타입 변경 =====

ALTER TABLE public.facility_reviews 
  ALTER COLUMN facility_id TYPE TEXT 
  USING facility_id::TEXT;

-- ===== 3단계: UNIQUE 제약 조건 재생성 =====

-- 사용자당 시설당 하나의 리뷰만 허용하는 인덱스
CREATE UNIQUE INDEX idx_reviews_one_per_user 
ON public.facility_reviews (facility_id, user_id, source)
WHERE is_active = true;

-- ===== 3.5단계: 트리거 함수 수정 (타입 캐스팅 추가) =====

-- facility_id(TEXT)와 memorial_spaces.id(bigint) 간의 비교를 위한 캐스팅 추가
CREATE OR REPLACE FUNCTION public.update_facility_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE memorial_spaces
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM facility_reviews
      WHERE facility_id = COALESCE(NEW.facility_id, OLD.facility_id) AND is_active = true
    ),
    review_count = (
      SELECT COUNT(*)
      FROM facility_reviews
      WHERE facility_id = COALESCE(NEW.facility_id, OLD.facility_id) AND is_active = true
    )
  WHERE id::text = COALESCE(NEW.facility_id, OLD.facility_id);  -- ⭐ 타입 캐스팅 추가
  
  RETURN COALESCE(NEW, OLD);  -- ⭐ DELETE/UPDATE 모든 작업 대응
END;
$function$;

-- ===== 4단계: reviews 데이터 이관 (유효한 데이터만 + content 길이 검증) =====

INSERT INTO public.facility_reviews (
    user_id, 
    facility_id, 
    author_name, 
    rating, 
    content, 
    photos,
    created_at,
    source,
    is_active
)
SELECT 
    user_id,
    facility_id,
    COALESCE(user_name, '익명') as author_name,
    rating::numeric,
    -- 10자 미만 content는 CHECK 제약조건 위반을 피하기 위해 NULL 처리
    CASE 
        WHEN content IS NULL OR length(content) < 10 THEN NULL
        ELSE content
    END as content,
    CASE 
        WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN
            (SELECT jsonb_agg(jsonb_build_object('url', img))
             FROM unnest(images) as img)
        ELSE '[]'::jsonb
    END as photos,
    created_at,
    'user' as source,
    true as is_active
FROM public.reviews
WHERE user_id IS NOT NULL      -- 필수 필드 검증
  AND facility_id IS NOT NULL  -- 필수 필드 검증
  AND rating IS NOT NULL       -- 필수 필드 검증
  AND NOT EXISTS (
    SELECT 1 FROM public.facility_reviews fr 
    WHERE fr.user_id = public.reviews.user_id 
    AND fr.facility_id = public.reviews.facility_id
    AND fr.source = 'user'
)
ON CONFLICT DO NOTHING;

-- ===== 5단계: RLS 정책 재설정 (조회/삽입/수정/삭제 권한 분리) =====

-- 1. 조회: 활성화된 리뷰는 누구나 확인 가능
CREATE POLICY "Anyone can view active reviews" 
ON public.facility_reviews FOR SELECT 
USING (is_active = true OR is_active IS NULL);

-- 2. 삽입: 인증된 사용자만 가능
CREATE POLICY "Authenticated users can insert" 
ON public.facility_reviews FOR INSERT 
TO authenticated 
WITH CHECK (
    user_id IS NOT NULL 
    AND facility_id IS NOT NULL
    AND source = 'user'
);

-- 3. 수정: 본인 소유 리뷰만 가능
CREATE POLICY "Users can update own reviews" 
ON public.facility_reviews FOR UPDATE 
TO authenticated 
USING (user_id = (auth.jwt() ->> 'sub'))
WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- 4. 소프트 삭제: 본인 소유 리뷰만 가능
CREATE POLICY "Users can soft delete own reviews" 
ON public.facility_reviews FOR UPDATE 
TO authenticated 
USING (
    user_id = (auth.jwt() ->> 'sub')
    AND is_active = true
)
WITH CHECK (
    user_id = (auth.jwt() ->> 'sub')
    AND is_active = false
);

-- ===== 6단계: 스키마 리로드 =====

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ===== 7단계: 검증 쿼리 =====

SELECT 
    '✅ facility_reviews 총 활성 리뷰 수' as status,
    COUNT(*) as count
FROM public.facility_reviews
WHERE is_active = true

UNION ALL

SELECT 
    '📊 reviews 원본 수 (전체)',
    COUNT(*)
FROM public.reviews

UNION ALL

SELECT 
    '⚠️ reviews 중 필드 누락 데이터 (제외됨)',
    COUNT(*)
FROM public.reviews
WHERE user_id IS NULL OR facility_id IS NULL OR rating IS NULL

UNION ALL

SELECT 
    '📝 content 10자 미만으로 NULL 처리된 데이터',
    COUNT(*)
FROM public.reviews
WHERE user_id IS NOT NULL AND facility_id IS NOT NULL AND rating IS NOT NULL
  AND (content IS NOT NULL AND length(content) < 10)

UNION ALL

SELECT 
    '🔄 이관된 user 리뷰 수',
    COUNT(*)
FROM public.facility_reviews
WHERE source = 'user'

UNION ALL

SELECT 
    '🔍 facility_id 타입 확인(text=1)',
    CASE 
        WHEN data_type = 'text' THEN 1
        ELSE 0
    END
FROM information_schema.columns
WHERE table_name = 'facility_reviews'
AND column_name = 'facility_id'
LIMIT 1;
