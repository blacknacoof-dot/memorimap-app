-- check_types.sql
-- Check actual data types of user_id columns
SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('consultations', 'facilities') 
AND column_name LIKE '%user_id%';
