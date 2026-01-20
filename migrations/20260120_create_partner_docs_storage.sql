-- Create partner_docs Storage Bucket and RLS Policies
-- 파일: 20260120_create_partner_docs_storage.sql
-- 목적: partner_docs Storage 버킷 생성 및 RLS 정책 설정

-- ============================================
-- 1. Storage Bucket 생성
-- ============================================

-- partner_docs 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner_docs', 'partner_docs', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. Storage RLS 정책 설정
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read partner_docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload partner_docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Select partner_docs" ON storage.objects;

-- 업로드 정책: 인증된 사용자만 업로드 가능
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'partner_docs' 
  AND auth.role() = 'authenticated'
);

-- 읽기 정책: 모든 사용자 읽기 가능 (public bucket)
CREATE POLICY "Allow public read partner_docs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'partner_docs');

-- ============================================
-- 3. 확인
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'partner_docs Storage bucket created successfully';
    RAISE NOTICE 'RLS policies applied: authenticated upload, public read';
END $$;
