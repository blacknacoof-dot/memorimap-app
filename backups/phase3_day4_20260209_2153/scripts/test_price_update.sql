-- 테스트: 2개 장례식장 가격 업데이트
-- 가격 정보 있는 것만 업데이트

-- 1. (복)대구가톨릭사회복지회논공 장례식장
-- 빈소+접객실: 20~50만원, 안치실: 6만원
UPDATE memorial_spaces
SET 
  price_range = '빈소 20~50만원 / 안치실 6만원'
WHERE name LIKE '%대구가톨릭%논공%' OR name LIKE '%논공%장례식장%';

-- 2. (유)금강장례식장
-- 안치실: 12만원 (빈소 정보 없음 - 안치실만 표시)
UPDATE memorial_spaces
SET 
  price_range = '안치실 12만원'
WHERE name LIKE '%금강장례식장%';

-- 확인용 쿼리
SELECT name, price_range, address
FROM memorial_spaces
WHERE name LIKE '%대구가톨릭%' OR name LIKE '%금강장례%';
