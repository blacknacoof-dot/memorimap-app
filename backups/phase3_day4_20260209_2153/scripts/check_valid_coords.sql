-- Check if there are ANY valid facilities with coordinates
SELECT 
    type, 
    COUNT(*) as total_count,
    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as valid_coords_count
FROM facilities
GROUP BY type;

-- Check what memorial_spaces has (Source of Truth)
SELECT 
    'memorial_spaces' as source,
    COUNT(*) as count,
    COUNT(CASE WHEN lat IS NOT NULL AND lng IS NOT NULL THEN 1 END) as valid_coords_count
FROM memorial_spaces;
