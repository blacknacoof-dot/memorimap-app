-- ============================================================
-- 데이터 분류 정리 마이그레이션
-- 날짜: 2026-02-24
-- 목적: 봉안시설/장례식장 오분류 수정, 동물장례 분리, 중복 삭제
-- ============================================================

BEGIN;

-- ============================================================
-- 1. columbarium → funeral_home (33건)
--    이름에 '장례식장', '장례문화원', '장례예식장' 포함 → 장례식장
-- ============================================================

UPDATE facilities SET type = 'funeral_home'
WHERE type = 'columbarium'
  AND (
    name LIKE '%장례식장%'
    OR name LIKE '%장례문화원%'
    OR name LIKE '%장례예식장%'
  );
-- 예상: 강화서해장례문화원, 계룡장례식장입구, 고성영락원장례식장,
--       교원예움 평택/포항/화성 장례식장, 그린장례문화원, 남해추모누리묘지 장례식장,
--       동래봉생병원SKY보람장례식장, 메디팜재활요양병원장례식장입구,
--       번동/연수/중앙/청담동/화곡본동 성당 장례식장,
--       보람여주/의정부 장례식장, 복지장례문화원, 삼천포시민장례식장입구,
--       여수보람장례식장, 영락원/영천영락원 장례식장,
--       진도군산림조합직영추모관장례식장, 천주교명일동/흥덕 성당장례식장,
--       천지장례식장, 추모원장례식장, 파주보람장례식장,
--       함백산추모공원장례식장, 함열백제장례예식장입구,
--       합천추모공원 장례식장, 현대S라이프연세병원장례식장,
--       홍성추모공원장례식장 등

-- ============================================================
-- 2. columbarium → sea_burial (1건)
--    해양장 서비스가 봉안시설로 분류된 건
-- ============================================================

UPDATE facilities SET type = 'sea_burial'
WHERE type = 'columbarium'
  AND name = '에이치서비스 마린바다장';

-- ============================================================
-- 3. funeral_home → pet_funeral (1건)
--    반려동물 장례식장이 일반 장례식장으로 분류된 건
-- ============================================================

UPDATE facilities SET type = 'pet_funeral'
WHERE type = 'funeral_home'
  AND name = '하늘반려장례식장';

-- ============================================================
-- 4. columbarium에서 시설이 아닌 항목 정리
--    '전국 서비스' 주소 = 물리적 시설이 아닌 상조/서비스 업체
--    → 이미 funeral_companies에 존재하므로 삭제
-- ============================================================

-- 먼저 FK 참조 제거 (memorial_spaces, favorites, reviews 등)
DELETE FROM memorial_spaces
WHERE facilities_id IN (
  SELECT id FROM facilities
  WHERE type = 'columbarium'
    AND address = '전국 서비스'
    AND name IN (
      '금강문화허브', '대노복지사업단', '두레문화',
      '바라밀', '에스제이산림조합', '유토피아퓨처'
    )
);

DELETE FROM favorites
WHERE facility_id IN (
  SELECT id FROM facilities
  WHERE type = 'columbarium'
    AND address = '전국 서비스'
    AND name IN (
      '금강문화허브', '대노복지사업단', '두레문화',
      '바라밀', '에스제이산림조합', '유토피아퓨처'
    )
);

DELETE FROM reviews
WHERE facility_id IN (
  SELECT id::text FROM facilities
  WHERE type = 'columbarium'
    AND address = '전국 서비스'
    AND name IN (
      '금강문화허브', '대노복지사업단', '두레문화',
      '바라밀', '에스제이산림조합', '유토피아퓨처'
    )
);

DELETE FROM facilities
WHERE type = 'columbarium'
  AND address = '전국 서비스'
  AND name IN (
    '금강문화허브', '대노복지사업단', '두레문화',
    '바라밀', '에스제이산림조합', '유토피아퓨처'
  );

-- ============================================================
-- 5. columbarium에서 시설이 아닌 기타 항목 정리
--    요양원/복지시설/향우회 등 봉안시설이 아닌 건
-- ============================================================

UPDATE facilities SET verified = false
WHERE type = 'columbarium'
  AND name IN (
    '노인요양원프란치스꼬의집',
    '성라자로마을',
    '성모자애원 나자렛집',
    '양우회',
    '인천호남향우회',
    '무지개뜨는언덕',
    '휴마루'
  );
-- 주의: 즉시 삭제 대신 verified=false로 비활성화 (수동 확인 후 삭제)

-- ============================================================
-- 6. funeral_companies에서 동물장례 삭제 (10건)
--    이들은 facilities.pet_funeral에 이미 존재하거나
--    pet_funeral 전용 테이블로 관리해야 함
-- ============================================================

DELETE FROM funeral_companies
WHERE name IN (
  '21그램',
  '굿바이엔젤',
  '모두펫상조',
  '스카이펫',
  '파트라슈',
  '펫문',
  '펫바라기',
  '펫포레스트',
  '포포즈',
  '해피엔딩'
);

-- ============================================================
-- 7. funeral_companies 중복 삭제 (1건)
--    '상조114' (빈 데이터) 삭제, '상조 114' (정상 데이터) 유지
-- ============================================================

DELETE FROM funeral_companies
WHERE name = '상조114'
  AND (rating IS NULL OR rating = 0)
  AND (review_count IS NULL OR review_count = 0);

-- ============================================================
-- 검증 쿼리 (실행 후 확인용)
-- ============================================================

-- 분류 변경 확인
DO $$
DECLARE
  v_columbarium_funeral INT;
  v_pet_in_sangjo INT;
  v_dup_sangjo INT;
BEGIN
  -- 봉안시설에 장례식장 이름 남아있는지
  SELECT COUNT(*) INTO v_columbarium_funeral
  FROM facilities
  WHERE type = 'columbarium'
    AND (name LIKE '%장례식장%' OR name LIKE '%장례문화원%' OR name LIKE '%장례예식장%');

  -- 상조에 동물장례 남아있는지
  SELECT COUNT(*) INTO v_pet_in_sangjo
  FROM funeral_companies
  WHERE name IN ('21그램','굿바이엔젤','모두펫상조','스카이펫','파트라슈','펫문','펫바라기','펫포레스트','포포즈','해피엔딩');

  -- 상조114 중복
  SELECT COUNT(*) INTO v_dup_sangjo
  FROM funeral_companies WHERE name = '상조114';

  RAISE NOTICE '검증 결과: 봉안시설에 장례식장=%건, 상조에 펫=%건, 상조114 중복=%건',
    v_columbarium_funeral, v_pet_in_sangjo, v_dup_sangjo;

  IF v_columbarium_funeral > 0 OR v_pet_in_sangjo > 0 OR v_dup_sangjo > 0 THEN
    RAISE NOTICE '⚠️ 일부 항목이 남아있습니다. 수동 확인이 필요합니다.';
  ELSE
    RAISE NOTICE '✅ 모든 분류 정리가 완료되었습니다.';
  END IF;
END $$;

COMMIT;
