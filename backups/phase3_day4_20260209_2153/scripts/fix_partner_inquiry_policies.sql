-- [FINAL] 파트너 문의 및 파일 업로드 에러 해결 (400/401 Fix)
-- Supabase SQL Editor에서 실행하세요.

BEGIN;

--------------------------------------------------------------------------------
-- 1. Storage 설정 (400 Bad Request 해결)
--------------------------------------------------------------------------------

-- 버킷 생성/업데이트
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner_docs', 'partner_docs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 기존 정책 정리
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Partner Docs Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Partner Docs Auth Upload" ON storage.objects;

-- public 읽기 허용
CREATE POLICY "Partner Docs Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'partner_docs' );

-- 로그인한 사용자 업로드 허용
CREATE POLICY "Partner Docs Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'partner_docs' );

--------------------------------------------------------------------------------
-- 2. Database RLS 설정 (401 Unauthorized 해결)
--------------------------------------------------------------------------------

ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

-- 기존 정책 정리
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON partner_inquiries;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON partner_inquiries;
DROP POLICY IF EXISTS "partner_inquiries_insert_policy" ON partner_inquiries;
DROP POLICY IF EXISTS "partner_inquiries_select_policy" ON partner_inquiries;

-- INSERT 정책: 인증된 사용자는 누구나 신청 가능
CREATE POLICY "partner_inquiries_insert_policy"
ON partner_inquiries FOR INSERT
TO authenticated
WITH CHECK (true);

-- SELECT 정책: 본인 신청 내역만 조회 (Clerk ID 호환)
CREATE POLICY "partner_inquiries_select_policy"
ON partner_inquiries FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'sub' = user_id);

COMMIT;

-- 확인 (실패핏�도 괜찮음)
SELECT 'SQL executed successfully' as status;
