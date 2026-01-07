
SELECT tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename IN ('facilities', 'favorites');

-- Also check storage policies if possible, usually in storage.objects or storage.policies which are not always directly accessible via standard pg_policies view depending on permissions.
-- Instead, I will create a robust policy fix script again ensuring READ is open.
