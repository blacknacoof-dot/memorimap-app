-- Force update the user with specific email to super_admin role
-- This reconciles the Database state with the Frontend hardcoded permission

UPDATE public.users
SET role = 'super_admin'
WHERE email = 'blacknacoof@gmail.com';

-- Verify the update
SELECT * FROM public.users WHERE email = 'blacknacoof@gmail.com';
