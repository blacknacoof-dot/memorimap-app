-- [상조 및 장례식장 통합] 기존 '익명' 리뷰를 다양한 성씨로 무작위 분산 업데이트
-- 대상 확정: '상조' 타입 및 'funeral' 관련 모든 시설

WITH surname_list AS (
  SELECT unnest(ARRAY['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임']) as sn
),
target_reviews AS (
  SELECT fr.id, 
         (SELECT sn FROM surname_list OFFSET floor(random() * 10) LIMIT 1) || '**' as new_name
  FROM public.facility_reviews fr
  LEFT JOIN public.facilities f ON fr.facility_id = f.id::text OR fr.facility_id = f.legacy_id
  WHERE (
      f.type IN ('상조', 'funeral', '장례식장') -- 상조와 일반 장례식장 포함
      OR f.name LIKE '%장례식장%'             -- 이름에 장례식장이 포함된 경우
      OR fr.facility_id LIKE 'fc%'            -- 상조 전용 ID 패턴
    )
    AND (
      fr.author_name = '익명' 
      OR fr.author_name IS NULL 
      OR fr.author_name = ''
    )
)
UPDATE public.facility_reviews fr
SET author_name = tr.new_name
FROM target_reviews tr
WHERE fr.id = tr.id;

-- 결과 확인
SELECT author_name, count(*) 
FROM public.facility_reviews fr
LEFT JOIN public.facilities f ON fr.facility_id = f.id::text OR fr.facility_id = f.legacy_id
WHERE (f.type IN ('상조', 'funeral', '장례식장') OR f.name LIKE '%장례식장%')
GROUP BY author_name
ORDER BY count(*) DESC;
