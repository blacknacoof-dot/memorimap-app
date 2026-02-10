-- ========================================================================
-- Funeral Companies UUID Synchronization Migration
-- ========================================================================
-- Purpose: Migrate funeral_companies from legacy IDs (fc1, fc2...) to UUID
--          by syncing with facilities table and updating all references
-- ========================================================================

BEGIN;

-- ===== STEP 0: Safety Check =====
DO $$ 
BEGIN
    RAISE NOTICE '=== Starting Funeral Companies UUID Migration ===';
    RAISE NOTICE 'Current timestamp: %', NOW();
END $$;

-- ===== STEP 1: Create missing facilities from funeral_companies =====
-- Insert companies that don't exist in facilities table yet

INSERT INTO public.facilities (
    name,
    type,
    description,
    address,
    phone,
    rating,
    review_count,
    image_url,
    images,
    legacy_id,
    user_id,
    status,
    verified,
    verified_at,
    price_range
)
SELECT 
    fc.name,
    '상조' as type,
    COALESCE(fc.description, fc.name || '의 프리미엄 상조 서비스입니다.') as description,
    '전국 서비스' as address, -- 상조 서비스는 특정 주소 대신 '전국 서비스'로 표시
    COALESCE(fc.phone, '1588-0000') as phone,
    COALESCE(fc.rating, 4.8) as rating,
    COALESCE(fc.review_count, 0) as review_count,
    fc.image_url,
    fc.features as images, -- funeral_companies의 features를 images 컬럼의 대체재로 사용하거나 빈 배열 처리
    fc.id as legacy_id,
    'system_funeral_migration' as user_id,
    'approved' as status,
    true as verified,
    NOW() as verified_at,
    fc.price_range
FROM public.funeral_companies fc
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.facilities f 
    WHERE f.type = '상조'
    AND (
        f.name ILIKE '%' || fc.name || '%'
        OR fc.name ILIKE '%' || f.name || '%'
        OR REPLACE(f.name, ' ', '') = REPLACE(fc.name, ' ', '')
    )
)
ON CONFLICT DO NOTHING;

-- ===== STEP 2: Create temporary mapping table =====
CREATE TEMP TABLE funeral_company_id_mapping AS
SELECT 
    fc.id as old_id,
    COALESCE(
        -- Try to find exact match
        (SELECT f.id FROM public.facilities f 
         WHERE f.type = '상조' 
         AND REPLACE(f.name, ' ', '') = REPLACE(fc.name, ' ', '')
         LIMIT 1),
        -- Try fuzzy match
        (SELECT f.id FROM public.facilities f 
         WHERE f.type = '상조' 
         AND (f.name ILIKE '%' || fc.name || '%' OR fc.name ILIKE '%' || f.name || '%')
         LIMIT 1),
        -- Fallback: use legacy_id match
        (SELECT f.id FROM public.facilities f 
         WHERE f.legacy_id = fc.id
         LIMIT 1)
    ) as new_id,
    fc.name
FROM public.funeral_companies fc;

-- Verify all mappings succeeded
DO $$ 
DECLARE
    unmapped_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmapped_count 
    FROM funeral_company_id_mapping 
    WHERE new_id IS NULL;
    
    IF unmapped_count > 0 THEN
        RAISE EXCEPTION 'CRITICAL: % companies could not be mapped to facilities!', unmapped_count;
    END IF;
    
    RAISE NOTICE '✅ All % companies successfully mapped', 
        (SELECT COUNT(*) FROM funeral_company_id_mapping);
END $$;

-- ===== STEP 3: Update facility_reviews references =====
UPDATE public.facility_reviews fr
SET facility_id = m.new_id::text
FROM funeral_company_id_mapping m
WHERE fr.facility_id = m.old_id;

-- Log update count
DO $$ 
DECLARE
    update_count INTEGER;
BEGIN
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated % facility_reviews records', update_count;
END $$;

-- ===== STEP 4: Update sangjo_favorites references =====
UPDATE public.sangjo_favorites sf
SET company_id = m.new_id::text
FROM funeral_company_id_mapping m
WHERE sf.company_id = m.old_id;

-- Log update count
DO $$ 
DECLARE
    update_count INTEGER;
BEGIN
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated % sangjo_favorites records', update_count;
END $$;

-- ===== STEP 5: Replace funeral_companies primary keys =====
-- Strategy: Insert with new UUID, then delete old records

-- 5.1: Insert new records with UUID
-- [Fix] Use DISTINCT ON (new_id) to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
-- This happens if multiple legacy IDs map to the same facility UUID.
INSERT INTO public.funeral_companies (
    id,
    name,
    description,
    image_url,
    rating,
    review_count,
    phone,
    price_range,
    features,
    benefits
)
SELECT DISTINCT ON (m.new_id::text)
    m.new_id::text,
    fc.name,
    fc.description,
    fc.image_url,
    fc.rating,
    fc.review_count,
    fc.phone,
    fc.price_range,
    fc.features,
    fc.benefits
FROM public.funeral_companies fc
JOIN funeral_company_id_mapping m ON fc.id = m.old_id
WHERE m.new_id::text != m.old_id  -- Only migrate if IDs are different
ORDER BY m.new_id::text, fc.review_count DESC -- Pick the one with more reviews if merged
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    rating = EXCLUDED.rating,
    review_count = EXCLUDED.review_count,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- 5.2: Delete old records (only legacy IDs that were migrated)
DELETE FROM public.funeral_companies fc
USING funeral_company_id_mapping m
WHERE fc.id = m.old_id 
AND m.new_id::text != m.old_id  -- Only delete if we created a new UUID version
AND m.old_id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';  -- Only delete non-UUID IDs

-- ===== STEP 6: Verification =====
DO $$ 
DECLARE
    fc_count INTEGER;
    fac_sangjo_count INTEGER;
    review_legacy_count INTEGER;
    fav_legacy_count INTEGER;
BEGIN
    -- Count final records
    SELECT COUNT(*) INTO fc_count FROM public.funeral_companies;
    SELECT COUNT(*) INTO fac_sangjo_count FROM public.facilities WHERE type = '상조';
    
    -- Check for remaining legacy IDs
    SELECT COUNT(*) INTO review_legacy_count 
    FROM public.facility_reviews 
    WHERE facility_id SIMILAR TO 'fc[0-9]+';
    
    SELECT COUNT(*) INTO fav_legacy_count 
    FROM public.sangjo_favorites 
    WHERE company_id SIMILAR TO 'fc[0-9]+';
    
    RAISE NOTICE '=== Migration Complete ===';
    RAISE NOTICE 'funeral_companies total: %', fc_count;
    RAISE NOTICE 'facilities (상조) total: %', fac_sangjo_count;
    RAISE NOTICE 'facility_reviews with legacy IDs: %', review_legacy_count;
    RAISE NOTICE 'sangjo_favorites with legacy IDs: %', fav_legacy_count;
    
    IF review_legacy_count > 0 OR fav_legacy_count > 0 THEN
        RAISE WARNING 'Some legacy IDs still remain! Manual review recommended.';
    END IF;
END $$;

-- ===== STEP 7: Export mapping for constants.ts update =====
-- This creates a reference table you can query later
CREATE TABLE IF NOT EXISTS public.funeral_company_legacy_mapping (
    old_id TEXT PRIMARY KEY,
    new_id UUID NOT NULL,
    company_name TEXT NOT NULL,
    migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.funeral_company_legacy_mapping (old_id, new_id, company_name)
SELECT old_id, new_id, name
FROM funeral_company_id_mapping
ON CONFLICT (old_id) DO UPDATE SET
    new_id = EXCLUDED.new_id,
    migrated_at = NOW();

COMMIT;
