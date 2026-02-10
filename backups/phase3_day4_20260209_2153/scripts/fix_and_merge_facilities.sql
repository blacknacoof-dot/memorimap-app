-- [FINAL FIX v2] Fix Schema & Merge Facilities
-- 해결: "ON CONFLICT (legacy_id)" 에러 해결을 위해 legacy_id에 유니크 제약조건을 추가합니다.
-- 절차:
-- 1. 중복된 legacy_id가 있다면 정리 (최신 것 하나만 남김)
-- 2. legacy_id에 UNIQUE INDEX 생성
-- 3. 데이터 통합 (Merge & Bridge)

BEGIN;

-- 1. 중복 정리 (혹시 모를 중복 데이터 제거)
-- legacy_id가 있고, 같은 legacy_id를 가진 데이터 중 created_at이 오래된 것을 삭제
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

-- 2. Unique Index 생성 (이미 있으면 pass)
CREATE UNIQUE INDEX IF NOT EXISTS idx_facilities_legacy_id ON facilities(legacy_id);

-- 3. 데이터 통합 (UPSERT)
INSERT INTO facilities (
    legacy_id,
    name,
    type,
    address,
    phone,
    latitude, -- Correct column
    longitude, -- Correct column
    image_url,
    images,
    description,
    rating,
    review_count,
    status,
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
    updated_at = NOW();

COMMIT;

-- 결과 확인
SELECT 
    'Facilities with Coords' as check_type, 
    COUNT(*) 
FROM facilities 
WHERE latitude IS NOT NULL;
