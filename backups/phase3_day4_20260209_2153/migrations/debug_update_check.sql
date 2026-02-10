-- ==========================================
-- 디버깅: 업데이트 확인 및 수동 업데이트
-- ==========================================

-- 1. 최근 업데이트된 시설 확인
SELECT 
  id,
  name,
  images,
  updated_at
FROM facilities
WHERE category = 'funeral_home'
ORDER BY updated_at DESC
LIMIT 5;

-- 2. funeral_real 이미지를 가진 시설 확인
SELECT 
  id,
  name,
  CAST(images AS TEXT) as images_text
FROM facilities
WHERE category = 'funeral_home'
  AND CAST(images AS TEXT) LIKE '%funeral_real%'
LIMIT 5;

-- 3. 기본 이미지를 가진 시설 수 확인
SELECT 
  COUNT(*) as total_with_defaults
FROM facilities
WHERE category = 'funeral_home'
  AND (
    CAST(images AS TEXT) LIKE '%/defaults/charnel_%'
    OR CAST(images AS TEXT) LIKE '%/defaults/funeral_%'
  );

-- 4. RLS 정책 확인
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'facilities';

-- ==========================================
-- 수동 업데이트 테스트 (1개 시설만)
-- ==========================================
-- 먼저 테스트용으로 1개 시설만 업데이트해봅니다
UPDATE facilities
SET 
  images = ARRAY[
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_1_1768784069719.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_2_1768784070579.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_3_1768784071268.jpg'
  ]::text[],
  updated_at = NOW()
WHERE id IN (
  SELECT id 
  FROM facilities 
  WHERE category = 'funeral_home'
    AND (
      CAST(images AS TEXT) LIKE '%/defaults/charnel_%'
      OR CAST(images AS TEXT) LIKE '%/defaults/funeral_%'
    )
  LIMIT 1
)
RETURNING id, name, images;
