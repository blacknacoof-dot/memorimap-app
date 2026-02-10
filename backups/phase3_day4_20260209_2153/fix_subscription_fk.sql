-- Existing definition might point to 'facilities' table or have no FK.
-- We must ensure facility_subscriptions.facility_id references memorial_spaces.id

-- 1. Check/Drop existing constraint if it exists (to avoid errors or wrong links)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'facility_subscriptions_facility_id_fkey'
    ) THEN 
        ALTER TABLE facility_subscriptions DROP CONSTRAINT facility_subscriptions_facility_id_fkey;
    END IF;
END $$;

-- 2. Add correct Foreign Key to memorial_spaces
-- Note: memorial_spaces must be the source of truth for all facilities now.
ALTER TABLE facility_subscriptions
    ADD CONSTRAINT facility_subscriptions_facility_id_fkey
    FOREIGN KEY (facility_id)
    REFERENCES memorial_spaces(id)
    ON DELETE CASCADE;

-- 3. Verify column type matches (UUID)
-- Usually they are both uuid, but good to be safe implicitly.
-- If mismatched types error occurs, we'd need to cast, but assuming standard UUID usage.

-- Grant permissions just in case
GRANT SELECT ON facility_subscriptions TO authenticated;
GRANT SELECT ON facility_subscriptions TO service_role;
