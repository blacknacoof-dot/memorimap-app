-- ==============================================================================
-- Migration: Secure AI Context (Data Protection)
-- Description: Moves sensitive 'ai_context' from 'facilities' (public) to 
--              'facility_secure_data' (private).
-- Date: 2026-01-24
-- ==============================================================================

-- 1. Create the secure table
CREATE TABLE IF NOT EXISTS facility_secure_data (
    facility_id UUID PRIMARY KEY REFERENCES facilities(id) ON DELETE CASCADE,
    ai_context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS immediately
ALTER TABLE facility_secure_data ENABLE ROW LEVEL SECURITY;

-- 3. Define Policies (Strict Access)

-- Policy: SuperClaude (Service Role) can do everything
CREATE POLICY "Service Role Full Access" ON facility_secure_data
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Facility Managers can VIEW and UPDATE their own data
CREATE POLICY "Facility Managers View Own Secrets" ON facility_secure_data
    FOR SELECT
    TO authenticated
    USING (
        facility_id IN (
            SELECT facility_id FROM facility_managers 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Facility Managers Update Own Secrets" ON facility_secure_data
    FOR UPDATE
    TO authenticated
    USING (
        facility_id IN (
            SELECT facility_id FROM facility_managers 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        facility_id IN (
            SELECT facility_id FROM facility_managers 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: No public access, no random authenticated access. Default is DENY.

-- 4. Migrate Data
-- Copy existing AI context data to the new table
INSERT INTO facility_secure_data (facility_id, ai_context)
SELECT id, ai_context 
FROM facilities 
WHERE ai_context IS NOT NULL AND ai_context != '';

-- 5. Cleanup
-- Remove the column from the public table to prevent leakage
ALTER TABLE facilities DROP COLUMN IF EXISTS ai_context;

-- 6. Grant Permissions (Standard)
GRANT ALL ON facility_secure_data TO service_role;
GRANT SELECT, UPDATE ON facility_secure_data TO authenticated;
GRANT ROW LEVEL SECURITY ON facility_secure_data TO authenticated;
GRANT ROW LEVEL SECURITY ON facility_secure_data TO service_role;
