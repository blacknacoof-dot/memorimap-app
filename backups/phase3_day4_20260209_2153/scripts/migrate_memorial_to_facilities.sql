-- memorial_spaces → facilities 데이터 마이그레이션
-- Supabase SQL Editor에서 실행하세요

-- 1. 매칭되지 않는 memorial_spaces 확인
SELECT COUNT(*) as unmatched_count
FROM memorial_spaces ms
LEFT JOIN facilities f ON ms.name = f.name
WHERE f.id IS NULL;

-- 2. memorial_spaces 데이터를 facilities에 삽입 (매칭되지 않는 것만)
-- user_id는 'system_migration'으로 설정
INSERT INTO facilities (
    id,
    user_id,
    name,
    type,
    description,
    address,
    address_detail,
    latitude,
    longitude,
    verified,
    status,
    view_count,
    created_at,
    updated_at,
    legacy_id
)
SELECT 
    gen_random_uuid(),  -- 새 UUID 생성
    'system_migration', -- 시스템 마이그레이션 사용자
    ms.name,
    COALESCE(ms.category::text, 'funeral_home'), -- 기본값 설정
    ms.description,
    ms.address,
    NULL, -- address_detail
    NULL, -- latitude
    NULL, -- longitude
    COALESCE(ms.is_verified, false),
    'active',
    0, -- view_count
    NOW(),
    NOW(),
    ms.id::text  -- 원래 memorial_spaces id 저장
FROM memorial_spaces ms
LEFT JOIN facilities f ON ms.name = f.name
WHERE f.id IS NULL
  AND ms.name IS NOT NULL
ON CONFLICT (name) DO NOTHING; -- 이름 중복 방지

-- 3. 삽입 결과 확인
SELECT 
  ms.id as memorial_space_id,
  ms.name,
  f.id as facility_id,
  f.legacy_id
FROM memorial_spaces ms
JOIN facilities f ON f.legacy_id = ms.id::text
ORDER BY ms.id
LIMIT 10;

-- 4. memorial_spaces.facilities_id 업데이트
UPDATE memorial_spaces ms
SET facilities_id = f.id
FROM facilities f
WHERE f.legacy_id = ms.id::text
  AND ms.facilities_id IS NULL;

-- 5. 최종 매핑 확인
SELECT 
  COUNT(*) as total_memorial_spaces,
  COUNT(ms.facilities_id) as mapped_count,
  COUNT(*) - COUNT(ms.facilities_id) as unmapped_count
FROM memorial_spaces ms;
