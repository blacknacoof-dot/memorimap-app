
-- 1. Check Referenced Table ID Types
SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name 
FROM 
    information_schema.columns 
WHERE 
    (table_name = 'facilities' AND column_name = 'id')
    OR (table_name = 'profiles' AND column_name = 'id');

-- 2. Check for Non-UUID Data in Reservations (Pre-migration safety check)
-- This checks if there are any values that will fail casting to UUID
WITH invalid_users AS (
    SELECT id, user_id 
    FROM reservations 
    WHERE user_id IS NOT NULL 
    AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
),
invalid_facilities AS (
    SELECT id, facility_id 
    FROM reservations 
    WHERE facility_id IS NOT NULL 
    AND facility_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
SELECT 
    (SELECT count(*) FROM invalid_users) as invalid_user_id_count,
    (SELECT count(*) FROM invalid_facilities) as invalid_facility_id_count,
    (SELECT string_agg(user_id, ', ') FROM invalid_users LIMIT 5) as sample_invalid_user_ids,
    (SELECT string_agg(facility_id, ', ') FROM invalid_facilities LIMIT 5) as sample_invalid_facility_ids;
