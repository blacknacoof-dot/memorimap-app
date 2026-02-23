-- ============================================================
-- 상조 중복 삭제 + 이미지 URL 수정
-- 날짜: 2026-02-24
-- 이미 Dashboard에서 실행 완료 (기록용)
-- ============================================================

BEGIN;

-- 1. 보람상조/예다함상조 이미지 URL 수정 (한글→UUID 파일명)
UPDATE funeral_companies SET image_url = 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/sangjo/22d3f507-e92e-425a-ac31-bf89a546ad22.JPG'
WHERE id = '22d3f507-e92e-425a-ac31-bf89a546ad22';

UPDATE funeral_companies SET image_url = 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/sangjo/18f5fd6b-d5e4-45a1-9707-302ae85cefd7.JPG'
WHERE id = '18f5fd6b-d5e4-45a1-9707-302ae85cefd7';

-- 2. 빈 데이터 중복 삭제 (rating=0, review_count=0, 같은 전화번호)
DELETE FROM funeral_companies WHERE name IN (
  '보람상조개발',
  '보람상조라이프',
  '보람상조리더스',
  '더케이예다함'
);

COMMIT;
