-- 1. 삭제할 대상 업체들의 ID를 우선 선정합니다 (미승인 업체 중 '프리드라이프'가 아닌 것들)
-- 2. 해당 업체들을 부모(parent_id)로 참조하고 있는 모든 레코드들의 관계를 끊습니다.
UPDATE memorial_spaces
SET parent_id = NULL
WHERE parent_id IN (
    SELECT id 
    FROM memorial_spaces 
    WHERE is_verified = false 
    AND name NOT LIKE '%프리드라이프%'
);

-- 3. 이제 본인들의 parent_id도 NULL로 초기화합니다 (순환 참조 방지)
UPDATE memorial_spaces
SET parent_id = NULL
WHERE is_verified = false
AND name NOT LIKE '%프리드라이프%';

-- 4. 이제 안전하게 대상을 삭제합니다.
DELETE FROM memorial_spaces
WHERE is_verified = false
AND name NOT LIKE '%프리드라이프%';

-- 삭제 결과 확인
SELECT count(*) as remaining_pending_count FROM memorial_spaces WHERE is_verified = false;
