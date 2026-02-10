-- Check table columns for facilities and memorial_spaces
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('facilities', 'memorial_spaces')
ORDER BY table_name, column_name;
