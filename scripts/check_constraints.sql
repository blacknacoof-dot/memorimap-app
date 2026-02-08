-- Check indexes and constraints on facilities
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'facilities';

SELECT 
    conname as constraint_name, 
    contype as constraint_type, 
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname = 'facilities';
