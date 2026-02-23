-- ============================================================
-- 상조 unsplash 이미지 → 로컬 이미지로 교체 (28건)
-- 날짜: 2026-02-24
-- 이미 스크립트로 실행 완료 (기록용)
-- ============================================================

BEGIN;

-- 정확 매칭 (13건)
UPDATE funeral_companies SET image_url = '/images/sangjo/경우라이프.JPG' WHERE name = '경우라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/금호라이프.JPG' WHERE name = '금호라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/늘곁애라이프온.JPG' WHERE name = '늘곁애라이프온';
UPDATE funeral_companies SET image_url = '/images/sangjo/다나상조.JPG' WHERE name = '다나상조';
UPDATE funeral_companies SET image_url = '/images/sangjo/다온플랜.JPG' WHERE name = '다온플랜';
UPDATE funeral_companies SET image_url = '/images/sangjo/대노복지사업단.JPG' WHERE name = '대노복지사업단';
UPDATE funeral_companies SET image_url = '/images/sangjo/대한라이프보증.JPG' WHERE name = '대한라이프보증';
UPDATE funeral_companies SET image_url = '/images/sangjo/디에스라이프.JPG' WHERE name = '디에스라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/삼우라이프.JPG' WHERE name = '삼우라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/삼육리더스라이프.JPG' WHERE name = '삼육리더스라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/우정라이프.JPG' WHERE name = '우정라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/유토피아퓨처.JPG' WHERE name = '유토피아퓨처';
UPDATE funeral_companies SET image_url = '/images/sangjo/태양라이프.JPG' WHERE name = '태양라이프';

-- gallery 배정 (15건)
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_1.jpg' WHERE name = 'SJ산림조합상조';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_2.jpg' WHERE name = '더피플라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_3.jpg' WHERE name = '보람상조실로암';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_4.jpg' WHERE name = '보람상조애니콜';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_5.jpg' WHERE name = '보훈상조';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_6.jpg' WHERE name = '부모사랑';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_7.jpg' WHERE name = '세종라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_8.jpg' WHERE name = '용인공원라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_9.jpg' WHERE name = '제이케이';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_10.jpg' WHERE name = '크리스찬상조';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_11.jpg' WHERE name = '평화누리';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_12.jpg' WHERE name = '프리드라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_13.jpg' WHERE name = '한라상조';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_14.jpg' WHERE name = '현대에스라이프';
UPDATE funeral_companies SET image_url = '/images/sangjo/gallery/sangjo_gallery_15.jpg' WHERE name = '효원상조';

COMMIT;
