-- [FINAL FIX] Merge & Bridge Facilities Data (Fix Missing Map Data)
-- memorial_spaces 테이블의 데이터를 facilities 테이블로 통합합니다.
-- 핵심 수정: lat/lng -> latitude/longitude 컬럼 매핑을 올바르게 처리합니다.

BEGIN;

-- 1. 기존 데이터 정리 (상조 데이터 제외하고 초기화가 필요한 경우 사용 - 지금은 안전하게 upsert 사용)
-- DELETE FROM facilities WHERE type != 'sangjo'; 

-- 2. memorial_spaces 데이터를 facilities로 복사 (UPSERT)
-- ON CONFLICT (legacy_id) DO UPDATE... 를 사용하여 중복 방지
-- legacy_id가 없는 경우를 대비해 name + address 조합으로도 체크할 수 있으나, 
-- 현재는 memorial_spaces.id를 facilities.legacy_id로 매핑하여 식별합니다.

INSERT INTO facilities (
    legacy_id,
    name,
    type,
    address,
    phone,
    latitude, -- [FIX] Correct column name
    longitude, -- [FIX] Correct column name
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
    id::text, -- legacy_id로 매핑
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
    lat, -- [FIX] Source column
    lng, -- [FIX] Source column
    image_url,
    gallery_images, -- images array 매핑
    description,
    rating,
    review_count,
    'active', -- status 기본값
    created_at,
    updated_at
FROM memorial_spaces
WHERE lat IS NOT NULL AND lng IS NOT NULL -- 좌표 있는 데이터만
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
    'Facilities Count' as type, count(*) 
FROM facilities 
WHERE latitude IS NOT NULL;
