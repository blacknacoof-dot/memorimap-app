
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 실제 데이터 기반 마이그레이션 스크립트
-- 생성일: 2026-01-15T01:27:41.059Z
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- [1] ENUM 타입 생성 (실제 데이터 기반)
DROP TYPE IF EXISTS facility_type CASCADE;
CREATE TYPE facility_type AS ENUM ('charnel_house', 'funeral', 'natural_burial', 'charnel', 'pet_funeral', 'funeral_hall', 'etc', 'park_cemetery', 'sea', 'pet');

COMMENT ON TYPE facility_type IS '실제 데이터에서 발견된 카테고리: charnel_house, funeral, natural_burial, charnel, pet_funeral, funeral_hall, etc, park_cemetery, sea, pet';

-- [2] 카테고리 매핑 참조 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS category_mapping (
  old_category TEXT PRIMARY KEY,
  new_category facility_type NOT NULL,
  display_name TEXT NOT NULL
);

-- [3] 매핑 데이터 삽입
INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('charnel_house', 'charnel_house', 'charnel_house') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = 'charnel_house';
INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('funeral', 'funeral', 'funeral') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = 'funeral';
INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('natural_burial', 'natural_burial', 'natural_burial') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = 'natural_burial';
INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('charnel', 'charnel', 'charnel') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = 'charnel';
INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('pet_funeral', 'pet_funeral', 'pet_funeral') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = 'pet_funeral';
INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('funeral_hall', 'funeral_hall', 'funeral_hall') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = 'funeral_hall';
INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('etc', 'etc', 'etc') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = 'etc';
INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('park_cemetery', 'park_cemetery', 'park_cemetery') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = 'park_cemetery';
INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('sea', 'sea', 'sea') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = 'sea';
INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('pet', 'pet', 'pet') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = 'pet';

-- [4] 기존 데이터 마이그레이션 (memorial_spaces → facilities)
-- 주의: 실제 실행 전에 백업 필수!

-- 4-1. 임시 백업 테이블 생성
CREATE TABLE IF NOT EXISTS memorial_spaces_backup AS 
SELECT * FROM memorial_spaces;

-- 4-2. 카테고리 변환
UPDATE memorial_spaces ms
SET category = (
  SELECT new_category 
  FROM category_mapping cm 
  WHERE cm.old_category = ms.category
)
WHERE category IN (SELECT old_category FROM category_mapping);

-- 4-3. facilities 테이블로 데이터 복사 (컬럼명 매핑)
INSERT INTO facilities (
  id, 
  name, 
  category, 
  address, 
  description,
  location,
  created_at,
  updated_at
)
SELECT 
  id,
  name,
  category::facility_type, -- 타입 캐스팅
  address,
  description,
  location,
  created_at,
  updated_at
FROM memorial_spaces
ON CONFLICT (id) DO NOTHING;

-- [5] 검증 쿼리
SELECT 
  category,
  COUNT(*) as count
FROM facilities
GROUP BY category
ORDER BY count DESC;

COMMENT ON TABLE facilities IS '마이그레이션 완료: 2026-01-15T01:27:41.059Z';
