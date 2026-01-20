-- Check partner_inquiries table schema
-- This will show all columns and their data types

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'partner_inquiries'
ORDER BY ordinal_position;
