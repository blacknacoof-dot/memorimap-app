-- DIAGNOSIS: Check Column Types
-- Purpose: Find out why '7' is causing "invalid input syntax for type uuid"

SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('memorial_spaces', 'favorites', 'user_likes', 'users');
