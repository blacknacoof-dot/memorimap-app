-- Critical Location Fix: 대지동공설묘지
-- 
-- ISSUE: Facility with Gwangju address showing in Seoul on map
-- Facility: 대지동공설묘지
-- ID: 646088c6-ff71-4fb4-81cc-58eedec2f70d
-- Address: 광주광역시 남구 대지동 산55
-- Current WRONG Coords: (37.6080, 126.9566) → Seoul
-- Correct Gwangju Coords: (35.1394, 126.8982) → Gwangju Namgu

-- STEP 1: Check current data
SELECT 
    id,
    name,
    address,
    lat AS current_lat,
    lng AS current_lng
FROM facilities
WHERE id = '646088c6-ff71-4fb4-81cc-58eedec2f70d';

-- STEP 2: Update with correct Gwangju coordinates
UPDATE facilities
SET 
    lat = 35.1394,
    lng = 126.8982
WHERE id = '646088c6-ff71-4fb4-81cc-58eedec2f70d';

-- STEP 3: Verify the update
SELECT 
    id,
    name,
    address,
    lat AS new_lat,
    lng AS new_lng
FROM facilities
WHERE id = '646088c6-ff71-4fb4-81cc-58eedec2f70d';

-- Expected result:
-- Name: 대지동공설묘지
-- Address: 광주광역시 남구 대지동 산55
-- Coordinates: (35.1394, 126.8982) ✅ Gwangju Namgu area
