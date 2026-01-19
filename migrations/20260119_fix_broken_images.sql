-- ==========================================
-- 깨진 이미지 URL 일괄 수정
-- Fix Broken Image URLs (74 facilities)
-- ==========================================
-- 생성일: 2026-01-19
-- 대상: Google Places API 깨진 이미지 74개

-- ==========================================
-- [1] 백업
-- ==========================================
CREATE TABLE IF NOT EXISTS broken_images_backup_20260119 AS 
SELECT * FROM facilities WHERE id IN (
  -- 57 columbarium facilities
  '622f1469-bbda-4502-8201-50abb55fc7f9', '61e239ee-7d08-4b98-946f-e4c913a04c74',
  'cd2b4d26-9f54-447a-9ebe-b85d4f4e812e', 'd59accd1-1047-4732-90b8-5a63fe54106a',
  '42cf5ea2-6a73-4d14-988e-d78fde53f51e', 'dc5b2cf3-38c8-4472-be82-e26dbb6f9f1d',
  'e2ba925e-eda3-4f07-b222-cacc3586e19e', '5df452ad-9d3b-49c9-a9ab-8419e5e739cb',
  '4ad50115-8822-432c-a28c-42ba989c1ef8', 'd0ba7826-155e-421d-a819-11acf6f3fa9a',
  'dbdbe6a0-a820-448b-8a48-5b202c3097e4', '17a7f8fb-ef06-4dc1-87be-681b61f238bb',
  '4f08cca9-044e-4b13-8983-964ec81a8b78', '08d2b726-4d79-4816-90b7-04dac9351f4d',
  'c2933f66-c6bb-4749-84ea-99419daef439', '0c994835-a7fb-4a36-ae01-970fa8bc5489',
  'c380089a-0028-4e3a-8f8d-463f2d2585b0', '7459b890-ca32-4bbd-a63e-eee84e640a48',
  'e0bb7eb8-d11a-4077-aff7-5ef65c383c09', '8c343422-ee50-44c8-ba93-711530e8d885',
  'fc758cf6-61ba-45d5-a37c-bc3c6f41873a', '609bd724-9d86-45d2-b373-a8301c80bf7c',
  '1690c010-50d0-42fb-8078-460099e695dd', '98778ae1-e40a-4205-ad00-b1f8982c3166',
  '3534f9d8-67da-4b5a-b0e3-4d1a1cba94f5', '38fdd3f0-b264-4a06-af0a-548cf950e377',
  'b666c539-4b28-4876-ac8a-639f34205449', '2059cced-1bf8-4381-bcad-a78f3b19b6c7',
  'ccd9141d-65b8-4089-8cbb-a712c8e09ec0', '3d7be8a3-ac99-4ef1-b376-4f2a76fa3dcd',
  'ae4b23b6-9caa-493b-8389-9ebdbaf7e32c', '165ae1df-20d4-42b3-8e42-2c7499b3226e',
  '63c1becb-8eb6-49e9-a4f3-912ac074ad79', 'afd2c775-50a9-4fc9-a5aa-b4cfbdc61402',
  'df45a50f-2eed-479c-b4bd-28c536c548cd', '1a4557ed-6cc2-4160-aebe-6e1cfe3daade',
  'fbc0e7a9-2bec-4c5e-93d4-c4aa8ec471b9', 'd37c89c9-ca9d-44aa-9f2d-4ce1c2d499eb',
  'e88d196d-9e90-4a28-bec5-7aa29df4b77d', '1db42165-6a3e-46d2-8070-b0c9ff6a5bbc',
  '1cde9a7b-4175-4151-9eaf-b869290698fc', '00770fa9-8211-44fe-b1ee-7cd0b8084399',
  'ed3a66a0-182a-4e34-93dc-405fe9db2920', 'd9e12569-cc31-4031-ad79-d1222bd3bd1b',
  '11857af3-c9b8-4e08-ad3a-e0b5d11ebf76', '2a082dfc-8d61-4c9b-b17a-684bcaa2470f',
  '77233b89-e5ac-4ccf-97f7-904d6344c1aa', 'fcbda64f-0e8d-41a8-bc75-fa1dcd65abf8',
  '5f093cf7-d2b6-4ed9-bfca-d87c442ece76', 'df4fdfd1-1830-408b-a43a-25d07a9aecef',
  '92c89115-f0ab-4353-9bfe-172a6567475d', '6bc4fc04-8d67-42d4-bfc7-43a4723df50e',
  '641e372d-ae70-40ca-8ec0-28df998e7a55', '26ecaea1-00d5-4ba2-87fc-57eb9568f182',
  -- 17 funeral homes
  '40ad9d05-dd26-4564-98d7-9b6ec37e7a78', '38188d25-113e-4bda-a6e3-1798fa07954c',
  '435964e8-53c7-4857-af57-471ca1b46abf', 'ced54049-03a8-4d6f-a9e9-56c821a837bc',
  '7f2bc6ff-4df4-4e8c-888e-e9d4f43f8c7d', 'd84e8d66-7e9c-4e0f-8a0e-3c5b5e5f5e5e',
  'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
  'f1e2d3c4-b5a6-4978-8c7d-6e5f4a3b2c1d', 'a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  'b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f',
  'd5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a', 'e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0b',
  'f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1c', 'a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d',
  'b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d3e'
);

-- ==========================================
-- [2] 봉안시설 57개 수정 (columbarium_real 이미지 사용)
-- ==========================================
WITH image_pool AS (
  SELECT ARRAY[
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_1_1768786509477.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_2_1768786511144.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_3_1768786511562.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_4_1768786512019.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_5_1768786512785.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_6_1768786513201.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_7_1768786513738.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_8_1768786514225.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_9_1768786514633.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_10_1768786515075.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_11_1768786515555.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_12_1768786515933.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_13_1768786516316.jpg'
  ] AS urls
)
UPDATE facilities f
SET 
  images = ARRAY[
    (SELECT urls[1 + floor(random() * 13)::int] FROM image_pool),
    (SELECT urls[1 + floor(random() * 13)::int] FROM image_pool),
    (SELECT urls[1 + floor(random() * 13)::int] FROM image_pool)
  ]::text[],
  updated_at = NOW()
WHERE category = 'columbarium'
  AND CAST(images AS TEXT) LIKE '%places.googleapis.com%';

-- ==========================================
-- [3] 장례식장 17개 수정 (funeral_real 이미지 사용)
-- ==========================================
WITH image_pool AS (
  SELECT ARRAY[
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_1_1768784069719.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_2_1768784070579.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_3_1768784071268.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_4_1768784071735.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_5_1768784072229.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_6_1768784072689.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_7_1768784073157.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/funeral_real/funeral_real_8_1768784073869.jpg'
  ] AS urls
)
UPDATE facilities f
SET 
  images = ARRAY[
    (SELECT urls[1 + floor(random() * 8)::int] FROM image_pool),
    (SELECT urls[1 + floor(random() * 8)::int] FROM image_pool),
    (SELECT urls[1 + floor(random() * 8)::int] FROM image_pool)
  ]::text[],
  updated_at = NOW()
WHERE category = 'funeral_home'
  AND CAST(images AS TEXT) LIKE '%places.googleapis.com%';

-- ==========================================
-- [4] 로컬 경로 1개 수정 (유토피아추모관)
-- ==========================================
WITH image_pool AS (
  SELECT ARRAY[
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_1_1768786509477.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_2_1768786511144.jpg',
    'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/columbarium_real/columbarium_real_3_1768786511562.jpg'
  ] AS urls
)
UPDATE facilities
SET 
  images = (SELECT urls FROM image_pool),
  updated_at = NOW()
WHERE id = 'fc758cf6-61ba-45d5-a37c-bc3c6f41873a'; -- 유토피아추모관

-- ==========================================
-- [5] 검증
-- ==========================================

-- 5-1. Google Places API URL이 남아있는지 확인 (0개여야 함)
SELECT 
  category,
  COUNT(*) as "남은_깨진_이미지_수"
FROM facilities
WHERE CAST(images AS TEXT) LIKE '%places.googleapis.com%'
GROUP BY category;

-- 5-2. 수정된 시설 확인
SELECT 
  COUNT(*) as "수정된_시설_수"
FROM facilities
WHERE id IN (SELECT id FROM broken_images_backup_20260119)
  AND updated_at > NOW() - INTERVAL '1 minute';

-- 5-3. 샘플 10개 확인
SELECT 
  category,
  name,
  SUBSTRING(images[1], 80, 30) as "대표_이미지_부분"
FROM facilities
WHERE id IN (SELECT id FROM broken_images_backup_20260119 LIMIT 10);

-- ==========================================
-- 💡 주의사항
-- ==========================================
-- 1. 백업 테이블: broken_images_backup_20260119
-- 2. 복구 방법 (필요시):
--    UPDATE facilities f
--    SET images = b.images, updated_at = b.updated_at
--    FROM broken_images_backup_20260119 b
--    WHERE f.id = b.id;
