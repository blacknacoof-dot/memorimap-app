-- [FINAL FIX v4] Fix Constraints, Handle NOT NULL & Merge Data
-- 문제 해결: 
-- 1. legacy_id 유니크 제약조건 부재 (v3 해결)
-- 2. user_id NOT NULL 제약조건 위반 (v4 해결)
-- 해결 방안: user_id가 없는 데이터는 'system'으로 설정하여 통합

BEGIN;

-- 1. 중복 데이터 제거 (legacy_id 기준, 최신 것 유지)
DELETE FROM facilities
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER (partition BY legacy_id ORDER BY created_at DESC) as rnum
        FROM facilities
        WHERE legacy_id IS NOT NULL
    ) t
    WHERE t.rnum > 1
);

-- 2. 유니크 제약조건 추가 (Constraint)
ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_legacy_id_key;
ALTER TABLE facilities ADD CONSTRAINT facilities_legacy_id_key UNIQUE (legacy_id);

-- 3. 데이터 통합 (좌표 복구 + user_id 처리)
INSERT INTO facilities (
    legacy_id,
    name,
    type,
    address,
    phone,
    latitude, 
    longitude,
    image_url,
    images,
    description,
    rating,
    review_count,
    status,
    user_id, -- [FIX] Added user_id
    created_at,
    updated_at
)
SELECT 
    id::text,
    name,
    CASE 
        WHEN category = 'funeral_home' THEN 'funeral_home'
        WHEN category = 'charnel_house' THEN 'charnel_house'
        WHEN category = 'natural_burial' THEN 'natural_burial'
        WHEN category = 'park_cemetery' THEN 'park_cemetery'
        ELSE category 
    END as type,
    address,
    phone,
    lat,
    lng,
    image_url,
    gallery_images,
    description,
    rating,
    review_count,
    'active',
    COALESCE(owner_user_id, 'system'), -- [FIX] Handle NOT NULL using 'system' fallback
    created_at,
    updated_at
FROM memorial_spaces
WHERE lat IS NOT NULL AND lng IS NOT NULL
ON CONFLICT (legacy_id) 
DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    status = 'active',
    user_id = COALESCE(facilities.user_id, EXCLUDED.user_id), -- Keep existing user_id if present
    updated_at = NOW();

COMMIT;

-- 검증 조회
SELECT 
    'Saved Facilities' as check_type, 
    count(*) 
FROM facilities 
WHERE latitude IS NOT NULL;
