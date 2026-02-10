-- Fix RLS policies to handle Clerk IDs (String) instead of strict UUIDs
-- auth.uid() tries to cast to UUID, which fails for Clerk IDs like 'user_...'

DROP POLICY IF EXISTS "Allow users to read their own hq admin status" ON sangjo_hq_admins;
DROP POLICY IF EXISTS "Allow users to read their own branch admin status" ON sangjo_users;

-- Re-create policies using auth.jwt() ->> 'sub' (Safe for text IDs)
CREATE POLICY "Allow users to read their own hq admin status"
ON sangjo_hq_admins FOR SELECT
TO authenticated
USING (user_id = (select auth.jwt() ->> 'sub'));

CREATE POLICY "Allow users to read their own branch admin status"
ON sangjo_users FOR SELECT
TO authenticated
USING (user_id = (select auth.jwt() ->> 'sub'));
