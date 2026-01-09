-- Remove test user from super_admins to restore normal user testing environment
DELETE FROM public.super_admins 
WHERE id = 'user_36vml1WCaPN5YGZFA84gzmgDHAW';

-- Verification
SELECT * FROM public.super_admins;
