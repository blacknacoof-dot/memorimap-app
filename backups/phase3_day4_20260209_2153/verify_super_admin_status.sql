-- Check the current status of the super admin user
SELECT 
    id as internal_uuid, 
    clerk_id, 
    email, 
    role, 
    name 
FROM public.users 
WHERE email = 'blacknacoof@gmail.com';
