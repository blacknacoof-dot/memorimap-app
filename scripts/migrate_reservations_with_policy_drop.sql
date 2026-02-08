
BEGIN;

-- 1. Drop existing policies that depend on the column types
DROP POLICY IF EXISTS "reservations_insert_authenticated" ON reservations;
DROP POLICY IF EXISTS "reservations_manage_own_or_admin" ON reservations;
DROP POLICY IF EXISTS "reservations_select_own" ON reservations;
DROP POLICY IF EXISTS "reservations_update_own" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can see their own reservations" ON reservations;

-- 2. Alter columns to UUID
ALTER TABLE reservations
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

ALTER TABLE reservations
ALTER COLUMN facility_id TYPE uuid USING facility_id::uuid;

-- 3. Add Foreign Key Constraints
ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_profile
FOREIGN KEY (user_id) REFERENCES profiles(id);

ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_facility
FOREIGN KEY (facility_id) REFERENCES facilities(id);

-- 4. Re-create RLS Policies with UUID casting
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can INSERT if user_id matches their token
CREATE POLICY "reservations_insert_authenticated"
ON reservations FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')::uuid
);

-- Policy: Users can view/update/delete their own reservations, OR Super Admins can manage all
CREATE POLICY "reservations_manage_own_or_admin"
ON reservations FOR ALL
TO authenticated
USING (
  user_id = (auth.jwt() ->> 'sub')::uuid
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = (auth.jwt() ->> 'sub')::uuid
      AND p.role = 'super_admin'
  )
);

COMMIT;
