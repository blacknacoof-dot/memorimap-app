SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('memorial_spaces', 'users') 
AND column_name IN ('owner_user_id', 'id', 'clerk_id');
