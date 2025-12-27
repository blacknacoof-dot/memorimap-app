-- ================================================
-- 대전 장례식장 데이터 보완 SQL
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- 1. 갤러리 첫 번째 이미지를 대표이미지로 설정 (대전 장례식장만)
UPDATE memorial_spaces
SET image_url = gallery_images[1]
WHERE address LIKE '%대전%'
  AND (image_url IS NULL OR image_url = '')
  AND gallery_images IS NOT NULL
  AND array_length(gallery_images, 1) > 0;

-- 2. 나진장례식장 소개/이미지 보완
UPDATE memorial_spaces
SET 
  description = '대전 서구 괴정동에 위치한 장례식장으로, 정성스러운 장례 서비스를 제공합니다.',
  image_url = 'https://15774129.go.kr/BCUser/facilitypic/7000000168/1554339118560.png'
WHERE name LIKE '%나진장례식장%';

-- 3. 미등록 시설 추가: 유성한가족병원장례식장
INSERT INTO memorial_spaces (name, type, address, phone, lat, lng, description, image_url)
VALUES (
  '유성한가족병원 장례식장',
  'funeral',
  '대전광역시 유성구 온천동로 43 (봉명동)',
  '042-611-9700',
  36.3525,
  127.3470,
  '유성구에 위치한 병원 장례식장으로, 24시간 운영되며 편리한 시설을 갖추고 있습니다.',
  'https://15774129.go.kr/BCUser/facilitypic/1434526212645_7000001073_0.jpg'
);

-- 4. 미등록 시설 추가: 시민장례식장
INSERT INTO memorial_spaces (name, type, address, phone, lat, lng, description, image_url)
VALUES (
  '시민장례식장',
  'funeral',
  '대전광역시 중구 보문산로 359, 별관 (문화동)',
  '042-253-4801',
  36.3080,
  127.4280,
  '대전 중구에 위치한 장례식장으로, 보문산 인근의 조용한 환경에서 장례를 치를 수 있습니다.',
  'https://15774129.go.kr/BCUser/facilitypic/7000002196/1709686250384.PNG'
);

-- ================================================
-- 확인용 쿼리 (실행 후 결과 확인)
-- ================================================
SELECT name, image_url, description, address
FROM memorial_spaces
WHERE address LIKE '%대전%'
  AND (type = 'funeral' OR name LIKE '%장례%')
ORDER BY name;
