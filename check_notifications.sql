-- Check user_notifications schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_notifications';

-- Check RLS policies for user_notifications
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_notifications';
