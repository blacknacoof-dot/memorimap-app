-- [Verification] 마이그레이션 결과 검증 쿼리

-- 1. 데이터 이관 수량 확인
SELECT 
    'facility_reviews (활성 리뷰)' as check_name,
    COUNT(*) as count
FROM public.facility_reviews
WHERE is_active = true

UNION ALL

SELECT 
    'reviews (원본 임시 테이블)',
    COUNT(*)
FROM public.reviews;

-- 2. 컬럼 타입 변경 확인 (TEXT여야 함)
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'facility_reviews'
AND column_name IN ('facility_id', 'user_id');

-- 3. 사진 데이터 변환 샘플 확인 (JSONB 배열 확인)
SELECT 
    id, 
    facility_id, 
    author_name, 
    photos 
FROM public.facility_reviews 
WHERE photos IS NOT NULL AND jsonb_array_length(photos) > 0
LIMIT 5;
