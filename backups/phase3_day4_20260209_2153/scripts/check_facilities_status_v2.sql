-- Check facilities status and coordinates validity (Corrected Column Names)
SELECT 
    'Status Distribution' as check_type,
    COALESCE(status, 'NULL') as status,
    count(*) as count
FROM facilities
GROUP BY status

UNION ALL

SELECT 
    'Null Coordinates' as check_type,
    'latitude/longitude is null' as status,
    count(*) as count
FROM facilities
WHERE latitude IS NULL OR longitude IS NULL;

-- Sample data check to see what we are dealing with
SELECT id, name, status, latitude, longitude, type 
FROM facilities 
ORDER BY created_at DESC 
LIMIT 5;
