-- partner_docs 버킷에 INSERT 정책 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. 버킷 ID 확인
SELECT id FROM storage.buckets WHERE name = 'partner_docs';

-- 2. INSERT 정책 생성 (인증된 사용자만 업로드 가능)
-- 위에서 확인한 버킷 ID로 대체하세요 (예: 'partner_docs' 버킷의 UUID)
INSERT INTO storage.policies (name, definition, bucket_id, operation)
VALUES (
  'Allow authenticated uploads',
  '(auth.role() = ''authenticated'')'::text,
  (SELECT id FROM storage.buckets WHERE name = 'partner_docs'),
  'INSERT'
)
ON CONFLICT DO NOTHING;

-- 3. 모든 정책 확인
SELECT p.name, p.operation, p.definition::text
FROM storage.policies p
JOIN storage.buckets b ON p.bucket_id = b.id
WHERE b.name = 'partner_docs';
