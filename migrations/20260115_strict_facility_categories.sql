-- 1. 트랜잭션 시작
BEGIN;

-- 2. 기존 CHECK 제약조건 제거 (type_check)
-- 기존 제약조건이 새로운 한글 카테고리 업데이트를 방해하므로 먼저 제거합니다.
ALTER TABLE memorial_spaces DROP CONSTRAINT IF EXISTS memorial_spaces_type_check;
ALTER TABLE memorial_spaces DROP CONSTRAINT IF EXISTS check_valid_category; -- 혹시 이전에 생성 시도했던 것이 있다면 제거

-- 3. 컬럼 이름 변경 (type -> category)
DO $$
BEGIN
  IF EXISTS(
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'memorial_spaces' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE memorial_spaces RENAME COLUMN type TO category;
  END IF;
END $$;

-- 4. 데이터 보정 - 기존 값들을 6가지 카테고리로 변환
-- 장례식장
UPDATE memorial_spaces
SET category = '장례식장'
WHERE category IN (
  '추모시설', '일반장례', 'funeral_hall', 'funeral_home', 
  'funeral', 'none'
);

-- 봉안시설
UPDATE memorial_spaces
SET category = '봉안시설'
WHERE category IN ('납골당', '봉안당', 'charnel_house', 'charnel');

-- 자연장
UPDATE memorial_spaces
SET category = '자연장'
WHERE category IN ('수목장', '잔디장', 'natural_burial', 'natural');

-- 공원묘지
UPDATE memorial_spaces
SET category = '공원묘지'
WHERE category IN ('공원', '묘지', 'memorial_park', 'park', 'complex');

-- 동물장례
UPDATE memorial_spaces
SET category = '동물장례'
WHERE category IN ('반려동물', 'pet_funeral', 'pet');

-- 해양장
UPDATE memorial_spaces
SET category = '해양장'
WHERE category IN ('바다장', 'sea_burial', 'sea');

-- 5. 알 수 없는 카테고리는 기본값으로 설정 (상조 제외)
-- '상조'는 UI에서 필터링하더라도 DB에는 남겨둘 수 있음. 여기서는 '상조'가 아닌 이상한 값들만 보정
UPDATE memorial_spaces
SET category = '봉안시설'
WHERE category NOT IN ('장례식장', '봉안시설', '자연장', '공원묘지', '동물장례', '해양장', '상조');

-- 6. 새로운 CHECK 제약조건 추가
ALTER TABLE memorial_spaces 
ADD CONSTRAINT check_valid_category
CHECK (category IN ('장례식장', '봉안시설', '자연장', '공원묘지', '동물장례', '해양장', '상조'));

-- 7. 인덱스 재생성 (성능 최적화)
DROP INDEX IF EXISTS idx_memorial_spaces_type;
CREATE INDEX IF NOT EXISTS idx_memorial_spaces_category ON memorial_spaces(category);

COMMIT;

-- 8. 최종 확인 쿼리 (트랜잭션 외부에서 실행 권장)
-- SELECT category, COUNT(*) FROM memorial_spaces GROUP BY category;
