-- 1. 기존 카테고리 제약조건(규칙) 삭제
ALTER TABLE facilities 
DROP CONSTRAINT IF EXISTS facilities_category_check;

-- 2. 'sangjo'를 포함하여 새로운 규칙 추가
ALTER TABLE facilities 
ADD CONSTRAINT facilities_category_check
CHECK (category IN (
    'funeral_home',    -- 장례식장
    'columbarium',     -- 봉안시설
    'natural_burial',  -- 자연장
    'cemetery',        -- 공원묘지
    'pet_funeral',     -- 동물장례
    'sea_burial',      -- 해양장
    'sangjo'           -- ✅ [추가됨] 상조
));

-- 3. [재실행] 상조업체 일괄 이동 (확장된 키워드 포함)
UPDATE facilities
SET category = 'sangjo'
WHERE category = 'funeral_home'
  AND (
    name LIKE '%상조%' 
    OR name LIKE '%라이프%' 
    OR name LIKE '%더리본%'     -- 더리본
    OR name LIKE '%불국토%'     -- 불국토상조
    OR name LIKE '%유토피아퓨처%'
    OR name LIKE '%금강문화허브%'
    OR name LIKE '%부모사랑%'
    OR name LIKE '%다온플랜%'
    OR name LIKE '%두레문화%'
    OR name LIKE '%바라밀%'
    OR name LIKE '%대명스테이션%'
    OR name LIKE '%에스제이산림조합%'
    OR name LIKE '%대노복지사업단%'
    OR name LIKE '%프리드%'
    OR name LIKE '%교원%'
    OR name LIKE '%효원%'
    OR name LIKE '%보람%'
    OR name LIKE '%재향군인회%'
    OR name LIKE '%예다함%'
    OR name LIKE '%공무원%'
    OR name LIKE '%디에스라이프%' 
    OR name LIKE '%DS라이프%'
  );

-- [결과 확인] 장례식장 목록에 아직도 '상조'나 '라이프'가 남아있는지 확인 (0개여야 함)
SELECT name, category 
FROM facilities 
WHERE category = 'funeral_home' 
  AND (name LIKE '%상조%' OR name LIKE '%라이프%' OR name LIKE '%디에스%');
