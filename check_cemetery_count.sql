-- 공원묘지 데이터 확인
-- 1. type별 시설 개수 확인
SELECT type, COUNT(*) as count
FROM memorial_spaces
GROUP BY type
ORDER BY count DESC;

-- 2. 공원묘지 관련 타입 확인 (charnel, cemetery, memorial 등)
SELECT DISTINCT type
FROM memorial_spaces
WHERE type ILIKE '%cemetery%' 
   OR type ILIKE '%charnel%'
   OR type ILIKE '%묘%'
   OR type ILIKE '%memorial%';

-- 3. 전체 공원묘지 목록
SELECT id, name, type, address
FROM memorial_spaces
WHERE type IN ('charnel', 'cemetery', 'memorial', 'memorial_park')
LIMIT 20;
