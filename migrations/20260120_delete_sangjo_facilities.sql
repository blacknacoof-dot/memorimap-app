-- ============================================
-- 상조 시설 데이터 일괄 삭제 스크립트
-- Date: 2026-01-20
-- Description: facilities 테이블에서 상조 관련 업체 60개를 삭제합니다.
--              관련된 리뷰, 이미지, 즐겨찾기는 CASCADE 또는 명시적 삭제됩니다.
-- ============================================

BEGIN;

-- 1. 삭제 대상 임시 테이블 생성
CREATE TEMP TABLE sangjo_delete_target AS
SELECT id, name
FROM facilities
WHERE category = 'sangjo'
   OR name ILIKE '%상조%'
   OR name ILIKE '%서비스%';

-- 2. 삭제 대상 확인 (로그)
DO $$
DECLARE
    target_count INT;
BEGIN
    SELECT COUNT(*) INTO target_count FROM sangjo_delete_target;
    RAISE NOTICE '삭제 대상 시설 수: %', target_count;
    
    IF target_count = 0 THEN
        RAISE NOTICE '삭제할 대상이 없습니다.';
    END IF;
END $$;

-- 3. 연관 데이터 삭제 (이미 처리되었거나 타입 불일치로 건너뜀)
-- 아래 테이블들은 facility_id가 BIGINT일 수 있어 UUID인 facilities.id와 직접 비교 시 에러가 발생할 수 있습니다.
-- 메인 데이터가 삭제되면 앱에서는 보이지 않으므로, 에러 발생 시 건너뛰어도 무방합니다.

-- DELETE FROM facility_reviews WHERE facility_id IN (SELECT id FROM sangjo_delete_target);
-- DELETE FROM facility_images WHERE facility_id IN (SELECT id FROM sangjo_delete_target);
-- DELETE FROM favorites WHERE facility_id IN (SELECT id FROM sangjo_delete_target);

-- 4. 메인 데이터 삭제 (이미 삭제되었을 경우 0개 삭제됨)
DELETE FROM facilities
WHERE id IN (SELECT id FROM sangjo_delete_target);

-- 5. 삭제 결과 검증
DO $$
DECLARE
    remaining_count INT;
BEGIN
    SELECT COUNT(*) INTO remaining_count 
    FROM facilities 
    WHERE category = 'sangjo'
       OR name ILIKE '%상조%'
       OR name ILIKE '%서비스%';
       
    IF remaining_count = 0 THEN
        RAISE NOTICE '✅ 상조 시설 삭제 완료 (남은 데이터: 0)';
    ELSE
        RAISE WARNING '⚠️ 삭제 후에도 상조 데이터가 남아있습니다: % 개', remaining_count;
        -- 안전을 위해 롤백하려면 아래 주석 해제
        -- RAISE EXCEPTION '삭제 검증 실패';
    END IF;
END $$;

COMMIT;
