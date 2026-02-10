-- Storage 버킷 public 설정으로 변경 (임시 해결책)
-- 주의: 보안을 위해 테스트 후 반드시 되돌리세요

-- 1. 버킷을 public으로 설정
UPDATE storage.buckets 
SET public = true 
WHERE name = 'partner_docs';

-- 2. 확인
SELECT name, public 
FROM storage.buckets 
WHERE name = 'partner_docs';
