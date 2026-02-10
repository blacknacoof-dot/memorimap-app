
BEGIN;

-- 1. Update partner_inquiries: Map Clerk ID to Profile UUID
-- We join with profiles on clerk_id and set user_id to profiles.id
UPDATE partner_inquiries pi
SET user_id = p.id::text
FROM profiles p
WHERE pi.user_id = p.clerk_id;

-- 2. Check how many are still invalid (i.e. did not find a profile)
-- These might be users who don't have a profile row or are legacy garbage
-- valid UUID regex: ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
DELETE FROM partner_inquiries
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 3. Now we can safely migrate the column to UUID
ALTER TABLE partner_inquiries
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 4. Add FK constraint if it doesn't exist
-- We reference profiles(id) not auth.users(id) because we are using our own profiles table as the source of truth for Clerk users
ALTER TABLE partner_inquiries
ADD CONSTRAINT fk_partner_inquiries_profile
FOREIGN KEY (user_id) REFERENCES profiles(id);

COMMIT;
