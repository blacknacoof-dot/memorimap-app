-- ============================================================
-- 시설 데이터 완성도 검증 리포트
-- ============================================================

-- 1. 활성 시설별 데이터 완성도
SELECT
  f.id,
  f.name,
  f.type,
  CASE WHEN f.images IS NOT NULL AND array_length(f.images, 1) > 0 THEN 'O' ELSE 'X' END AS photos,
  CASE WHEN f.phone IS NOT NULL AND f.phone != '' THEN 'O' ELSE 'X' END AS phone_check,
  CASE WHEN f.description IS NOT NULL AND f.description != '' THEN 'O' ELSE 'X' END AS desc_check,
  (SELECT count(*) FROM facility_packages fp WHERE fp.facility_id = f.id AND fp.is_active = true) AS package_count
FROM facilities f
WHERE f.status = 'active' OR f.verified = true
ORDER BY f.type, f.name;

-- 2. 유형별 완성도 요약
SELECT
  f.type,
  count(*) AS total,
  count(*) FILTER (WHERE f.images IS NOT NULL AND array_length(f.images, 1) > 0) AS has_photos,
  count(*) FILTER (WHERE f.phone IS NOT NULL AND f.phone != '') AS has_phone,
  count(*) FILTER (WHERE f.description IS NOT NULL AND f.description != '') AS has_desc,
  count(DISTINCT fp.facility_id) AS has_packages
FROM facilities f
LEFT JOIN facility_packages fp ON fp.facility_id = f.id AND fp.is_active = true
WHERE f.status = 'active' OR f.verified = true
GROUP BY f.type
ORDER BY f.type;

-- 3. 패키지 없는 활성 시설 목록
SELECT f.id, f.name, f.type
FROM facilities f
WHERE (f.status = 'active' OR f.verified = true)
  AND NOT EXISTS (SELECT 1 FROM facility_packages fp WHERE fp.facility_id = f.id AND fp.is_active = true)
ORDER BY f.type, f.name;
