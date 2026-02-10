-- partner_docs 버킷 Storage 정책 확인 및 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. 버킷 ID 확인
SELECT id, name, public 
FROM storage.buckets 
WHERE name = 'partner_docs';

-- 2. 정책 확인 (policies 테이블이 storage 스키마에 없으면 아래 쿼리는 실패할 수 있음)
-- 대신 아래 INSERT 문으로 직접 정책 생성

-- 3. INSERT 정책 생성 (인증된 사용자만 업로드 가능)
-- 버킷 ID를 위에서 확인한 값으로 대체하세요
INSERT INTO storage.policies (name, definition, bucket_id, operation)
SELECT 
  'Allow authenticated uploads',
  '(auth.role() = ''authenticated'')'::text,
  id,
  'INSERT'
FROM storage.buckets 
WHERE name = 'partner_docs'
ON CONFLICT DO NOTHING;

-- 4. SELECT 정책 생성 (모든 사용자가 읽기 가능)
INSERT INTO storage.policies (name, definition, bucket_id, operation)
SELECT 
  'Allow public read',
  '(true)'::text,
  id,
  'SELECT'
FROM storage.buckets 
WHERE name = 'partner_docs'
ON CONFLICT DO NOTHING;

-- 5. 생성된 정책 확인
SELECT p.name, p.operation, p.definition::text
FROM storage.policies p
JOIN storage.buckets b ON p.bucket_id = b.id
WHERE b.name = 'partner_docs';
