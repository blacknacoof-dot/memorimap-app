
-- 1. Find the reservation(s) with the invalid facility_id
SELECT * FROM reservations WHERE facility_id = 'fc_freedlife_001';

-- 2. Search for the facility to see if a valid UUID exists
SELECT * FROM facilities WHERE name LIKE '%프리드%' OR id::text = 'fc_freedlife_001' OR legacy_id = 'fc_freedlife_001';
