-- 매핑되지 않은 memorial_spaces를 facilities에 추가
INSERT INTO facilities (
    id, user_id, name, type, description, address, 
    verified, status, view_count, created_at, updated_at, legacy_id
)
SELECT 
    gen_random_uuid(),
    'system_migration',
    ms.name,
    COALESCE(ms.category::text, 'funeral_home'),
    ms.description,
    ms.address,
    COALESCE(ms.is_verified, false),
    'active',
    0,
    NOW(),
    NOW(),
    ms.id::text
FROM memorial_spaces ms
WHERE ms.facilities_id IS NULL
  AND ms.name IS NOT NULL;

-- 새로 추가된 facilities와 memorial_spaces 연결
UPDATE memorial_spaces ms
SET facilities_id = f.id
FROM facilities f
WHERE f.legacy_id = ms.id::text
  AND ms.facilities_id IS NULL;

-- 결과 확인
SELECT 
  COUNT(*) as total,
  COUNT(facilities_id) as mapped,
  COUNT(*) - COUNT(facilities_id) as unmapped
FROM memorial_spaces;
