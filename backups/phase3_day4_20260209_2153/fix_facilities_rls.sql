-- =============================================
-- 긴급 수정: facilities 테이블 공개 읽기 정책
-- =============================================
-- Supabase SQL Editor에서 실행하세요!

-- 1. facilities 테이블 RLS 확인 및 활성화
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "public_read_facilities" ON facilities;
DROP POLICY IF EXISTS "Anyone can read facilities" ON facilities;

-- 3. 모든 사용자(익명 포함)에게 읽기 허용
CREATE POLICY "Anyone can read facilities"
  ON facilities
  FOR SELECT
  TO public
  USING (true);

-- 4. memorial_spaces 테이블도 동일하게 적용 (상조 데이터)
ALTER TABLE memorial_spaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_memorial_spaces" ON memorial_spaces;
DROP POLICY IF EXISTS "Anyone can read memorial_spaces" ON memorial_spaces;

CREATE POLICY "Anyone can read memorial_spaces"
  ON memorial_spaces
  FOR SELECT
  TO public
  USING (true);

-- 5. 이미지/사진 테이블이 있다면 동일하게 적용
-- (테이블 이름이 다르면 수정 필요)
-- ALTER TABLE facility_photos ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Anyone can read facility_photos" ON facility_photos;
-- CREATE POLICY "Anyone can read facility_photos"
--   ON facility_photos
--   FOR SELECT
--   TO public
--   USING (true);

-- 6. GRANT 권한 부여
GRANT SELECT ON facilities TO anon, authenticated;
GRANT SELECT ON memorial_spaces TO anon, authenticated;

SELECT 'RLS policies for facilities and memorial_spaces added successfully!' as message;
