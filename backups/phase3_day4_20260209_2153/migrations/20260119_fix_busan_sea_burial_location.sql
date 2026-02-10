-- Fix for "부산 연안 해양장" Location Error
-- 
-- ISSUE: Facility with Busan address is showing in Seoul on map
-- Facility: 부산 연안 해양장
-- ID: aa89f083-0204-49d7-a46b-82ea79be23ac
-- Current Wrong Coords: (37.5724291754866, 127.006978785184) → Seoul
-- Correct Busan Coords: Need to geocode "부산광역시 해운대구 달맞이길 62"
--
-- Expected Haeundae coordinates should be approximately:
-- Latitude: ~35.16 (Haeundae Beach area)
-- Longitude: ~129.16 (Haeundae Beach area)

-- STEP 1: First, let's see the current data
SELECT 
    id,
    name,
    address,
    lat,
    lng,
    category
FROM facilities
WHERE id = 'aa89f083-0204-49d7-a46b-82ea79be23ac';

-- STEP 2: Update with correct Haeundae-gu coordinates
-- Using Dalmaji-gil (달맞이길) area coordinates near Haeundae Beach
UPDATE facilities
SET 
    lat = 35.1621,  -- Approximate latitude for Dalmaji-gil, Haeundae-gu
    lng = 129.1829  -- Approximate longitude for Dalmaji-gil, Haeundae-gu
WHERE id = 'aa89f083-0204-49d7-a46b-82ea79be23ac';

-- STEP 3: Verify the update
SELECT 
    id,
    name,
    address,
    lat,
    lng,
    category
FROM facilities
WHERE id = 'aa89f083-0204-49d7-a46b-82ea79be23ac';

-- NOTE: These are approximate coordinates for the Dalmaji-gil area.
-- For precise coordinates, we should use Naver/Kakao geocoding API
-- to convert the exact address "부산광역시 해운대구 달맞이길 62"
