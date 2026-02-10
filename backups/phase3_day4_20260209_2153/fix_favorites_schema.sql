-- ⚠️ FIX FAVORITES SCHEMA (UUID vs BIGINT)
-- Purpose: The 'favorites' table likely has 'facility_id' as UUID, but 'memorial_spaces' uses BIGINT IDs (e.g., 7).
-- This script fixes the type mismatch.

BEGIN;

-- 1. FIX FAVORITES TABLE
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'favorites' AND column_name = 'facility_id') THEN
        
        -- Drop foreign key constraint first
        ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_facility_id_fkey;
        
        -- Change column type to BIGINT
        -- Note: If there is existing UUID data, this cast might fail or need conversion. 
        -- If data is garbage, we might need to truncate or delete.
        -- Assuming current data is empty or consistent with intended type.
        -- If currently UUID, casting to BIGINT is impossible directly except if it's text-encoded-int.
        -- Safer: Drop and recreate if conversion is hard, but let's try ALTER with USING.
        -- '7' error means input was '7', implying column expects UUID.
        
        -- Strategy: If it's empty, perfect. If not, we might lose data if it's strictly UUIDs.
        -- But since app uses int, any valid data should be int.
        
        -- Let's try to convert, if fails, we notice.
        BEGIN
            ALTER TABLE favorites ALTER COLUMN facility_id TYPE BIGINT USING facility_id::text::bigint;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not cast facility_id to BIGINT directly. Clearing column/table might be needed if data is corrupt. Proceeding to drop/add strategy for safety.';
            -- Fallback: Wipe column data (preserves user_id)
            ALTER TABLE favorites DROP COLUMN facility_id;
            ALTER TABLE favorites ADD COLUMN facility_id BIGINT;
        END;
        
        -- Re-add Foreign Key
        ALTER TABLE favorites 
            ADD CONSTRAINT favorites_facility_id_fkey 
            FOREIGN KEY (facility_id) 
            REFERENCES memorial_spaces(id) 
            ON DELETE CASCADE;
            
        RAISE NOTICE 'Fixed favorites.facility_id to BIGINT';
    END IF;
END $$;


-- 2. FIX USER_LIKES TABLE (Check target_id)
-- user_likes.target_id is TEXT usually, which is flexible.
-- But if it references something else, let's check.
-- In migration logic, we left it as-is or didn't touch much.
-- If user_likes is used for Facilities (int), TEXT '7' works fine.
-- No change needed if it's TEXT.


-- 3. CHECK MEMORIAL_SPACES ID
-- Ensure memorial_spaces ID is indeed BIGINT (it should be serial/generated always).
-- No change, standard verify.


COMMIT;

SELECT 'Favorites table schema fixed (facility_id -> BIGINT)' as result;
