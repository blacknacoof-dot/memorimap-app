-- Check RLS policies for memorial_spaces and facilities
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies
WHERE tablename IN ('memorial_spaces', 'facilities')
ORDER BY tablename, policyname;
