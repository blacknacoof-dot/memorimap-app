-- [데이터 중복 제거 스크립트]
-- 이름과 주소가 완벽히 동일한 시설 중, 정보가 가장 많은 1개만 남기고 삭제합니다.

BEGIN;

-- 임시 테이블을 만들어 삭제할 ID들을 식별
CREATE TEMP TABLE duplicates_to_delete AS
SELECT id
FROM (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY name, address 
            ORDER BY 
                (CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 1 ELSE 0 END) DESC, -- 사진 있는 것 우선
                (CASE WHEN legacy_id IS NOT NULL THEN 1 ELSE 0 END) DESC, -- legacy_id 있는 것 우선
                updated_at DESC -- 최근 업데이트된 것 우선
        ) as rn
    FROM public.facilities
    WHERE name IS NOT NULL AND address IS NOT NULL
) sub
WHERE rn > 1; -- 1등 빼고 나머지(2, 3...)는 삭제 대상

-- 삭제 실행
DELETE FROM public.facilities
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- 결과 확인용 (삭제된 개수 확인)
-- DO 블록 안에서는 출력이 어려우므로, 실행 후 "DELETE x" 메시지로 확인

COMMIT;
