-- Check facilities status and coordinates validity
SELECT 
    'Status Distribution' as check_type,
    status,
    count(*) as count
FROM facilities
GROUP BY status

UNION ALL

SELECT 
    'Null Coordinates' as check_type,
    'lat/lng is null' as status,
    count(*) as count
FROM facilities
WHERE lat IS NULL OR lng IS NULL;

-- Sample data check
SELECT id, name, status, lat, lng, type FROM facilities LIMIT 5;
