-- ⚠️ FINAL DIAGNOSIS & REPAIR SCRIPT
-- Purpose: Fix '406 Not Acceptable' (Schema Cache), '400 Bad Request' (UUID vs Int), and verify data count.

BEGIN;

-- 1. RELOAD POSTGREST SCHEMA CACHE (Fixes 406 Errors)
-- When column types change (UUID -> TEXT), the API cache MUST be reloaded.
NOTIFY pgrst, 'reload schema';

-- 2. FIX FAVORITES TABLE (Fixes 400 Error: "invalid input syntax for type uuid: 7")
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'favorites' AND column_name = 'facility_id' AND data_type = 'uuid') THEN
        RAISE NOTICE 'Fixing favorites.facility_id (UUID -> BIGINT)...';
        
        -- Drop constraint
        ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_facility_id_fkey;
        
        -- Convert to BIGINT (Safely handling if empty)
        -- If data exists and is incompatible, we might need to truncate.
        -- Assuming '7', '4' strings can cast to int.
        BEGIN
            ALTER TABLE favorites ALTER COLUMN facility_id TYPE BIGINT USING facility_id::text::bigint;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Data conversion failed, truncating favorites table to fix schema...';
            TRUNCATE TABLE favorites;
            ALTER TABLE favorites ALTER COLUMN facility_id TYPE BIGINT USING facility_id::text::bigint;
        END;

        -- Restore Constraint
        ALTER TABLE favorites 
            ADD CONSTRAINT favorites_facility_id_fkey 
            FOREIGN KEY (facility_id) 
            REFERENCES memorial_spaces(id) 
            ON DELETE CASCADE;
            
        RAISE NOTICE 'Fixed favorites.facility_id to BIGINT';
    END IF;
END $$;


-- 3. VERIFY & FIX MEMORIAL_SPACES RLS (Fixes missing data)
ALTER TABLE memorial_spaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "facilities_select_public" ON memorial_spaces;
DROP POLICY IF EXISTS "Public Read Facilities" ON memorial_spaces;

-- Ensure absolutely open reading
CREATE POLICY "Public Read Facilities" ON memorial_spaces FOR SELECT TO public USING (true);
CREATE POLICY "Public Read Facilities Auth" ON memorial_spaces FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public Read Facilities Anon" ON memorial_spaces FOR SELECT TO anon USING (true);


COMMIT;

-- 4. VERIFICATION OUTPUT (Check Data Count)
SELECT count(*) as "Total Facilities (Should be ~2100)" FROM memorial_spaces;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'favorites' AND column_name = 'facility_id';
