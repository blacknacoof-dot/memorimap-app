-- ============================================================
-- 상조회사를 facilities 테이블에서 제거
-- 상조회사는 funeral_companies 테이블에서 관리되며,
-- 지도 검색이 아닌 상조 서비스 추천 탭에서만 표시됨
-- ============================================================

-- 1. 삭제 대상 확인 (먼저 실행하여 확인)
SELECT id, name, type, status, address, phone
FROM facilities
WHERE type = 'sangjo'
ORDER BY name;

-- 2. 삭제 실행 (확인 후 실행)
DELETE FROM facilities WHERE type = 'sangjo';

-- 3. 검증
SELECT count(*) as remaining_sangjo FROM facilities WHERE type = 'sangjo';
-- 결과: 0이어야 함

-- 4. 전체 시설 타입 분포 확인
SELECT type, count(*) as cnt
FROM facilities
WHERE status = 'active'
GROUP BY type
ORDER BY cnt DESC;
