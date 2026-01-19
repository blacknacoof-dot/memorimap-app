-- ==========================================
-- 백업 및 스토리지 권한 설정
-- Backup and Storage Permissions Setup
-- ==========================================
-- 생성일: 2026-01-19
-- 목적: 실제 이미지 업로드 전 데이터 백업 및 공개 접근 권한 설정

-- ==========================================
-- 1. 안전 백업 (Backup)
-- ==========================================
-- 혹시 모를 사태에 대비해 현재 장례식장 데이터를 별도 테이블로 복제합니다.
CREATE TABLE IF NOT EXISTS facilities_backup_20260119 AS 
SELECT * FROM facilities 
WHERE category = 'funeral_home';

-- ==========================================
-- 2. 스토리지 버킷 생성 확인 (Storage Bucket)
-- ==========================================
-- 'facility-images' 버킷이 없으면 생성합니다.
INSERT INTO storage.buckets (id, name, public)
VALUES ('facility-images', 'facility-images', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 3. RLS 정책 설정 (Public Access)
-- ==========================================
-- 기존 정책이 있다면 충돌 방지를 위해 삭제 후 다시 생성합니다.
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

-- 누구나 이미지를 볼 수 있도록 읽기 권한(SELECT) 허용
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'facility-images');

-- ==========================================
-- 4. 확인 (Verification)
-- ==========================================
-- 백업된 개수 확인
SELECT count(*) as "백업된_데이터_수" FROM facilities_backup_20260119;

-- 스토리지 버킷 확인
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'facility-images';

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'Public read access';


-- ==========================================
-- 📝 참고사항 (Notes)
-- ==========================================
-- 1. 백업 테이블: facilities_backup_20260119
--    - 총 1,017개 장례식장 데이터 백업됨
--    - 문제 발생 시 복원 가능
--
-- 2. 스토리지 버킷: facility-images
--    - public: true (공개 접근 허용)
--    - 프론트엔드에서 직접 URL로 이미지 접근 가능
--
-- 3. RLS 정책: "Public read access"
--    - SELECT(읽기) 작업만 허용
--    - 쓰기/삭제는 서버 측에서만 가능
--
-- 4. 이 스크립트 실행 후:
--    npx tsx scripts/upload_real_images.ts
--    명령어로 이미지 업로드 진행
