
BEGIN;

-- 1. Alter user_id to UUID
-- We use USING to explicitly cast the existing text values to uuid
ALTER TABLE reservations
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 2. Alter facility_id to UUID
ALTER TABLE reservations
ALTER COLUMN facility_id TYPE uuid USING facility_id::uuid;

-- 3. Add Foreign Key Constraints (Ensure Referential Integrity)
-- This ensures that valid reservations must point to existing users and facilities
ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_profile
FOREIGN KEY (user_id) REFERENCES profiles(id);

ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_facility
FOREIGN KEY (facility_id) REFERENCES facilities(id);

COMMIT;
