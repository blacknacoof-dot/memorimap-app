-- Check if facility data exists
SELECT 
  'memorial_spaces' as table_name, 
  count(*) as count 
FROM memorial_spaces
UNION ALL
SELECT 
  'facilities' as table_name, 
  count(*) as count 
FROM facilities;
