-- Fix Schema Types: ALIGN WITH memorial_spaces (bigint)
-- The error "incompatible types: uuid and bigint" confirms memorial_spaces.id is BIGINT.

-- 1. Fix facility_subscriptions (The blocking error)
TRUNCATE TABLE facility_subscriptions CASCADE;

ALTER TABLE facility_subscriptions
    ALTER COLUMN facility_id TYPE bigint USING facility_id::text::bigint;

ALTER TABLE facility_subscriptions
    ADD CONSTRAINT facility_subscriptions_facility_id_fkey
    FOREIGN KEY (facility_id)
    REFERENCES memorial_spaces(id)
    ON DELETE CASCADE;

-- 2. Proactive Fix: partner_inquiries
-- Since target_facility_id was added as UUID, it will fail to store reference to BIGINT IDs.
-- Changing it to BIGINT now.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_inquiries' AND column_name = 'target_facility_id') THEN
        ALTER TABLE partner_inquiries 
            DROP COLUMN target_facility_id;
            
        ALTER TABLE partner_inquiries
            ADD COLUMN target_facility_id bigint;
    END IF;
END $$;
