-- ==========================================
-- 기본 이미지 클린업 마이그레이션
-- Cleanup Default Supabase Storage Images
-- ==========================================
-- 생성일: 2026-01-19
-- 목적: 기본 Supabase 스토리지 URL을 가진 장례식장 이미지를 NULL로 초기화
--       → 랜덤 이미지 할당 로직이 작동하도록 함

-- Step 1: 기본 이미지를 가진 장례식장 조회 (검증용)
-- 실행 전 확인: 어떤 시설이 영향받는지 미리 확인
SELECT 
  id, 
  name, 
  address,
  images,
  CAST(images AS TEXT) as images_text
FROM facilities
WHERE category = 'funeral_home'
  AND CAST(images AS TEXT) LIKE '%xvmpvzldezpoxxsarizm.supabase.co/storage%';

-- 예상 결과: 약 517개 시설이 조회될 것으로 예상됨


-- Step 2: 기본 이미지 NULL로 초기화
-- ⚠️ 주의: 이 작업은 되돌릴 수 없습니다! Step 1 확인 후 실행하세요.
-- 
-- 실행 방법:
-- 1. 위 SELECT 쿼리로 영향받을 시설 확인
-- 2. 확인 후 아래 UPDATE 쿼리 주석 해제하여 실행
-- 3. 실행 후 verify_default_images.ts로 재검증

/*
UPDATE facilities
SET 
  images = NULL,
  updated_at = NOW()
WHERE category = 'funeral_home'
  AND CAST(images AS TEXT) LIKE '%xvmpvzldezpoxxsarizm.supabase.co/storage%';
*/

-- Step 3: 결과 확인
-- UPDATE 실행 후 다시 조회하여 모두 NULL로 변경되었는지 확인
/*
SELECT 
  COUNT(*) as total_null_images
FROM facilities
WHERE category = 'funeral_home'
  AND (images IS NULL OR images = '[]'::jsonb);
*/


-- ==========================================
-- 📝 참고사항 (Notes)
-- ==========================================
-- 1. 기본 이미지 패턴: xvmpvzldezpoxxsarizm.supabase.co/storage
-- 2. 영향받는 카테고리: funeral_home (장례식장)만
-- 3. 이 스크립트 실행 후:
--    - App.tsx의 랜덤 이미지 할당 로직이 작동함
--    - 각 시설에 3개의 랜덤 이미지가 자동 할당됨
-- 4. 백업 권장: 실행 전 facilities 테이블 백업 권장
--    예: CREATE TABLE facilities_backup AS SELECT * FROM facilities;
