-- ================================================
-- search_facilities_v2 Performance Analysis
-- Run this in Supabase SQL Editor
-- Date: 2026-02-02
-- ================================================

-- 1. Check current indexes on facilities table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'facilities'
ORDER BY indexname;

-- 2. Check table statistics
SELECT 
    relname as table_name,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables 
WHERE relname = 'facilities';

-- 3. EXPLAIN ANALYZE on search_facilities_v2 (Seoul Center, 5km radius)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM search_facilities_v2(
    37.5665,    -- Seoul center lat
    126.9780,   -- Seoul center lng
    5000,       -- 5km radius
    NULL,       -- All categories
    50          -- Limit 50
);

-- 4. EXPLAIN ANALYZE on search_facilities_v2 (Larger radius - 20km)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM search_facilities_v2(
    37.5665,    -- Seoul center lat
    126.9780,   -- Seoul center lng
    20000,      -- 20km radius (stress test)
    NULL,       -- All categories
    100         -- Limit 100
);

-- 5. Check if GIST index exists on location column
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'facilities' 
AND indexdef LIKE '%GIST%';

-- 6. Check lat/lng column indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'facilities' 
AND (indexdef LIKE '%lat%' OR indexdef LIKE '%lng%');

-- ================================================
-- EXPECTED RESULTS INTERPRETATION:
-- ================================================
-- 
-- GOOD:
--   - "Index Scan" or "Index Only Scan" in output
--   - Execution Time < 50ms
--   - Buffers: shared hit (not read)
--
-- WARNING:
--   - "Bitmap Heap Scan" in output
--   - Execution Time 50-200ms
--
-- CRITICAL (needs optimization):
--   - "Seq Scan" in output
--   - Execution Time > 200ms
--   - High "Rows Removed by Filter" count
--
-- ================================================
