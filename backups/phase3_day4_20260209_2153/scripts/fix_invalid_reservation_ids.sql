
-- Fix invalid facility_id to allow UUID conversion
UPDATE reservations
SET facility_id = '7fd43013-842d-4cbb-94ca-8ca0dc3ac785' -- UUID for "프리드라이프 (Preed Life)"
WHERE facility_id = 'fc_freedlife_001';

-- Verify no invalid IDs remain
SELECT count(*) as remaining_invalid_count
FROM reservations 
WHERE facility_id IS NOT NULL 
AND facility_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
