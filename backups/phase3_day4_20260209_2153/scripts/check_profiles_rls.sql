-- Check RLS policies for profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    permissive,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';
