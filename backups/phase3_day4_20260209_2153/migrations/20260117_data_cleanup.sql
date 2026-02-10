-- 1. [명칭 수정] '주식회사 헤븐앤어스' -> '명지병원 장례식장(헤븐앤어스)'
UPDATE facilities
SET name = '명지병원 장례식장(헤븐앤어스)'
WHERE name = '주식회사 헤븐앤어스' AND category = 'funeral_home';

-- 2. [삭제] 주차장, 입구, 향우회 (확실한 삭제 대상)
DELETE FROM facilities
WHERE category = 'funeral_home'
  AND name IN (
    '인천호남향우회', 
    '횡성군장례문화센터주차장', 
    '함열백제장례예식장입구'
  );

-- 3. [이동] '강화파라다이스' -> 봉안시설(columbarium)로 이동
UPDATE facilities
SET category = 'columbarium'
WHERE category = 'funeral_home'
  AND name = '강화파라다이스 강화지점';

-- [검증] 변경된 데이터 확인
SELECT id, name, category 
FROM facilities 
WHERE name IN (
    '명지병원 장례식장(헤븐앤어스)', 
    '인천호남향우회', 
    '횡성군장례문화센터주차장', 
    '함열백제장례예식장입구', 
    '강화파라다이스 강화지점'
);
