-- Fix Schema Mismatch: facility_subscriptions.facility_id (bigint) -> memorial_spaces.id (uuid)
-- [Update] Added CASCADE to handle dependent tables like 'subscription_payments'

-- 1. Drop existing data AND dependent data (payments) to clean slate for type change
TRUNCATE TABLE facility_subscriptions CASCADE;

-- 2. Alter column type to UUID
ALTER TABLE facility_subscriptions
    ALTER COLUMN facility_id TYPE uuid USING facility_id::text::uuid;

-- 3. Add Foreign Key Constraint
ALTER TABLE facility_subscriptions
    ADD CONSTRAINT facility_subscriptions_facility_id_fkey
    FOREIGN KEY (facility_id)
    REFERENCES memorial_spaces(id)
    ON DELETE CASCADE;

-- 4. Verify/Grant permissions
GRANT SELECT ON facility_subscriptions TO authenticated;
GRANT SELECT ON facility_subscriptions TO service_role;
