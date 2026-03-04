-- 상조 회사가 facilities 테이블에 잘못 분류된 경우 정리
-- 참조 테이블 먼저 정리 후 삭제 (FK 제약 순서 준수)

-- 삭제 대상 ID를 text로 수집 (타입 불일치 방지)
DO $$
DECLARE
  target_ids text[];
BEGIN
  SELECT ARRAY(SELECT id::text FROM facilities WHERE name IN (
    '불국토', '전국서비스', '용인라이프', '용인공원라이프',
    '금강문화허브', '두레문화', '에스제인산림조합'
  )) INTO target_ids;

  RAISE NOTICE '삭제 대상 시설 ID: %', target_ids;
END $$;

-- 1. memorial_spaces
DELETE FROM memorial_spaces
WHERE facilities_id::text IN (
  SELECT id::text FROM facilities WHERE name IN (
    '불국토', '전국서비스', '용인라이프', '용인공원라이프',
    '금강문화허브', '두레문화', '에스제인산림조합'
  )
);

-- 2. consultations
DELETE FROM consultations
WHERE facility_id::text IN (
  SELECT id::text FROM facilities WHERE name IN (
    '불국토', '전국서비스', '용인라이프', '용인공원라이프',
    '금강문화허브', '두레문화', '에스제인산림조합'
  )
);

-- 3. reservations
DELETE FROM reservations
WHERE facility_id::text IN (
  SELECT id::text FROM facilities WHERE name IN (
    '불국토', '전국서비스', '용인라이프', '용인공원라이프',
    '금강문화허브', '두레문화', '에스제인산림조합'
  )
);

-- 4. facility_reviews
DELETE FROM facility_reviews
WHERE facility_id::text IN (
  SELECT id::text FROM facilities WHERE name IN (
    '불국토', '전국서비스', '용인라이프', '용인공원라이프',
    '금강문화허브', '두레문화', '에스제인산림조합'
  )
);

-- 5. favorites
DELETE FROM favorites
WHERE facility_id::text IN (
  SELECT id::text FROM facilities WHERE name IN (
    '불국토', '전국서비스', '용인라이프', '용인공원라이프',
    '금강문화허브', '두레문화', '에스제인산림조합'
  )
);

-- 6. facilities 본 테이블 삭제
DELETE FROM facilities
WHERE name IN (
  '불국토',
  '전국서비스',
  '용인라이프',
  '용인공원라이프',
  '금강문화허브',
  '두레문화',
  '에스제인산림조합'
);
