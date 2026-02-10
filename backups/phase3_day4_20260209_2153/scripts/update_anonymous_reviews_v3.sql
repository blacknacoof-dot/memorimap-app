-- [상조 및 장례식장 통합] 모든 리뷰어 이름 마스킹 처리 (v3)
-- 대상: '상조' 타입 및 'funeral' 관련 모든 시설
-- 규칙: '익명'은 무작위 성씨로, 기존 실명은 성씨만 남기고 마스킹 (ex: 최준혁 -> 최**)

BEGIN;

WITH target_facilities AS (
  SELECT id::text as fid FROM public.facilities 
  WHERE type IN ('상조', 'funeral', '장례식장') OR name LIKE '%장례식장%'
  UNION
  SELECT id::text FROM public.facilities WHERE id::text LIKE 'fc%'
),
surname_list AS (
  SELECT unnest(ARRAY['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임']) as sn
)
UPDATE public.facility_reviews fr
SET author_name = CASE 
    -- 1. '익명'이거나 비어있는 경우: 무작위 성씨 부여
    WHEN (author_name = '익명' OR author_name IS NULL OR author_name = '' OR author_name = 'NULL') 
    THEN (SELECT sn FROM surname_list OFFSET floor(random() * 10) LIMIT 1) || '**'
    
    -- 2. 이미 마스킹된 경우 (XX**): 그대로 유지 (단, 글자 수가 3글자가 넘으면 자름)
    WHEN author_name LIKE '%**' 
    THEN left(author_name, 1) || '**'
    
    -- 3. 실명인 경우: 첫 글자(성씨)만 남기고 마스킹
    ELSE left(author_name, 1) || '**'
END
WHERE facility_id IN (SELECT fid FROM target_facilities);

COMMIT;

-- 결과 확인
SELECT author_name, count(*) 
FROM public.facility_reviews fr
LEFT JOIN public.facilities f ON fr.facility_id = f.id::text OR fr.facility_id = f.legacy_id
WHERE (f.type IN ('상조', 'funeral', '장례식장') OR f.name LIKE '%장례식장%')
GROUP BY author_name
ORDER BY count(*) DESC;
