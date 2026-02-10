-- ============================================================
-- Verification Script: Check Migration v6.2 Results (Fixed)
-- ============================================================

-- 1. Check Table Schema (Column Types)
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'facilities' 
  AND column_name IN ('lat', 'lng', 'category');

-- 2. Check Coordinate Uniqueness
-- Goal: Uniqueness > 95% (Indicates jitter/spiderfy worked)
SELECT 
  COUNT(*) as total_facilities,
  COUNT(DISTINCT (lat, lng)) as unique_coords,
  ROUND(COUNT(DISTINCT (lat, lng)) * 100.0 / COUNT(*), 1) as uniqueness_pct
FROM facilities;

-- 3. Check Category Standardization
-- Goal: Only English standard codes (funeral_home, etc.) should appear
SELECT category, COUNT(*) as count
FROM facilities 
GROUP BY category 
ORDER BY count DESC;

-- 4. Check Null Coordinates
-- Goal: Should be 0
SELECT COUNT(*) as null_coords_count
FROM facilities
WHERE lat IS NULL OR lng IS NULL;
