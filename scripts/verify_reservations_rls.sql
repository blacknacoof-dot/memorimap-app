
-- 1. Check RLS Policies for 'reservations'
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'reservations';

-- 2. Check Column Types for Key IDs
SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'reservations' 
    AND column_name IN ('id', 'user_id', 'facility_id', 'payment_id');
