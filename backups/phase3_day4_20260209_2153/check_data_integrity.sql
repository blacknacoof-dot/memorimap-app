-- DATA INTEGRITY CHECK
-- Purpose: Confirm specific data existence (Count and ID=7)

-- 1. Count Total Rows
SELECT count(*) as "Total Facilities (Goal: ~2100)" FROM memorial_spaces;

-- 2. Check for ID=7 (The one causing errors earlier)
SELECT * FROM memorial_spaces WHERE id = 7;

-- 3. Check for ID=4
SELECT * FROM memorial_spaces WHERE id = 4;
