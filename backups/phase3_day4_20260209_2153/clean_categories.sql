-- 0. (중요) 기존 카테고리 제약조건 삭제
-- 이 제약조건이 'funeral' 같은 새로운 영어 코드 입력을 막고 있으므로 삭제합니다.
ALTER TABLE facilities DROP CONSTRAINT IF EXISTS facilities_category_check;

-- 1. 장례식장 -> 'funeral'
UPDATE facilities SET category = 'funeral'
WHERE name LIKE '%장례식장%' OR name LIKE '%병원%';

-- 2. 봉안시설 (납골당, 묘원, 수목장 등) -> 'charnel' (대표값)
UPDATE facilities SET category = 'charnel'
WHERE name LIKE '%공원%' OR name LIKE '%묘원%' OR name LIKE '%추모%' 
   OR name LIKE '%봉안%' OR name LIKE '%숲%';

-- 3. 해양장 (바다장) -> 'sea'
UPDATE facilities SET category = 'sea'
WHERE name LIKE '%바다%' OR name LIKE '%해양%' OR name LIKE '%선상%';

-- 4. 동물장례 -> 'pet'
UPDATE facilities SET category = 'pet'
WHERE name LIKE '%애견%' OR name LIKE '%동물%' OR name LIKE '%펫%';

-- 5. (선택사항) 새로운 제약조건 추가 (필요시)
-- 데이터 무결성을 위해 새로운 값들만 허용하도록 다시 제약을 걸 수 있습니다.
-- ALTER TABLE facilities ADD CONSTRAINT facilities_category_check 
-- CHECK (category IN ('funeral', 'charnel', 'sea', 'pet', 'memorial_park', 'hall'));

-- 6. 확인
SELECT name, category FROM facilities ORDER BY category;
