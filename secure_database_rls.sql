-- ==========================================
-- Secure Database RLS Implementation Script
-- ==========================================

-- 0. Cleanup existing policies (to ensure clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Super Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Super Admins can update users" ON users;

DROP POLICY IF EXISTS "Public can view facilities" ON memorial_spaces;
DROP POLICY IF EXISTS "Super Admins can insert facilities" ON memorial_spaces;
DROP POLICY IF EXISTS "Super Admins can update facilities" ON memorial_spaces;
DROP POLICY IF EXISTS "Owners can update own facility" ON memorial_spaces;

DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Owners can view facility reservations" ON reservations;
DROP POLICY IF EXISTS "Super Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Users can insert reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Owners can update facility reservations" ON reservations;
DROP POLICY IF EXISTS "Super Admins can update reservations" ON reservations;

DROP POLICY IF EXISTS "Public can view reviews" ON facility_reviews;
DROP POLICY IF EXISTS "Users can insert reviews" ON facility_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON facility_reviews;
DROP POLICY IF EXISTS "Super Admins can delete reviews" ON facility_reviews;

DROP POLICY IF EXISTS "Owners can view own subscription" ON facility_subscriptions;
DROP POLICY IF EXISTS "Super Admins can view all subscriptions" ON facility_subscriptions;

-- 1. Helper Functions
-- is_super_admin: Checks if current user is super_admin. Security Definer to bypass RLS on users table itself.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE clerk_id = auth.uid()::text
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Table: users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = clerk_id);

CREATE POLICY "Super Admins can view all users"
  ON users FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = clerk_id);
  -- Note: Limit columns in frontend or trigger if rigorous field-level security needed.

CREATE POLICY "Super Admins can update users"
  ON users FOR UPDATE
  USING (is_super_admin());

-- 3. Table: memorial_spaces
ALTER TABLE memorial_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view facilities"
  ON memorial_spaces FOR SELECT
  USING (true);

CREATE POLICY "Super Admins can insert facilities"
  ON memorial_spaces FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admins can update facilities"
  ON memorial_spaces FOR UPDATE
  USING (is_super_admin());

CREATE POLICY "Owners can update own facility"
  ON memorial_spaces FOR UPDATE
  USING (owner_user_id = auth.uid()::text);

-- 4. Table: reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Owners can view facility reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorial_spaces
      WHERE id::text = reservations.facility_id::text
      AND owner_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Super Admins can view all reservations"
  ON reservations FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Users can insert reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Owners can update facility reservations"
  ON reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM memorial_spaces
      WHERE id::text = reservations.facility_id::text
      AND owner_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Super Admins can update reservations"
  ON reservations FOR UPDATE
  USING (is_super_admin());

-- 5. Table: facility_reviews
ALTER TABLE facility_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reviews"
  ON facility_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert reviews"
  ON facility_reviews FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own reviews"
  ON facility_reviews FOR DELETE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Super Admins can delete reviews"
  ON facility_reviews FOR DELETE
  USING (is_super_admin());

-- 6. Table: facility_subscriptions
ALTER TABLE facility_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own subscription"
  ON facility_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorial_spaces
      WHERE id::text = facility_subscriptions.facility_id::text
      AND owner_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Super Admins can view all subscriptions"
  ON facility_subscriptions FOR SELECT
  USING (is_super_admin());
