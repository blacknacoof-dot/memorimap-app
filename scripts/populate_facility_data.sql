-- ==============================================================================
-- [Data Optimization] Facility Data Enrichment (Phase 1)
-- Description: Adding missing columns and populating smart default data
-- ==============================================================================

-- 1. 컬럼 추가 (description, features)
-- 기존 facilities 테이블에 정보성 필드가 부족하여 추가합니다.
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS features TEXT[];

-- 2. 소개글 (Description) 일괄 생성
-- 이름과 주소를 조합하여 전문적인 소개글을 자동 생성합니다.
UPDATE public.facilities
SET description = name || '은(는) 유가족분들의 슬픔을 함께 나누며, 품격 있고 경건한 추모 예식을 돕는 시설입니다. ' || 
                  CASE 
                    WHEN address IS NOT NULL AND address != '' THEN split_part(address, ' ', 1) || ' ' || split_part(address, ' ', 2) || ' 지역의 접근성이 좋은 위치에 자리하고 있습니다.'
                    ELSE '교통이 편리한 위치에 자리하고 있습니다.'
                  END
WHERE description IS NULL OR description = '';

-- 3. 특징 (Features) 일괄 생성 - 장례식장 (Funeral Halls)
UPDATE public.facilities
SET features = ARRAY['주차 가능', '전문 장례식장', '식당/매점', '24시간 상담']
WHERE (features IS NULL OR features = '{}') AND (name LIKE '%병원%' OR category = 'funeral_hall');

-- 4. 특징 (Features) 일괄 생성 - 추모 시설 (Memorials)
UPDATE public.facilities
SET features = ARRAY['자연 친화적', '넓은 주차장', '제례실 운영', '안치 전문']
WHERE (features IS NULL OR features = '{}') AND (category IN ('charnel_house', 'natural_burial', 'park_cemetery', 'complex_cemetery'));

-- 5. 특징 (Features) 일괄 생성 - 기타 기본값
UPDATE public.facilities
SET features = ARRAY['주차 상담', '24시간 상담', '친절한 안내']
WHERE (features IS NULL OR features = '{}');

-- 6. RPC 함수 업데이트 (선택 사항)
-- search_facilities 함수가 이 컬럼들을 반환하도록 수정하는 것이 좋습니다.
-- (대시보드에서 직접 실행하여 함수 정의를 갱신해 주세요)
