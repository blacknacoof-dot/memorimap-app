-- [상조 서비스 전용] 기존 '익명' 리뷰를 다양한 성씨(김, 이, 박, 최, 정, 강, 조, 윤, 장, 임)로 무작위 분산 업데이트
-- 행마다 random()이 개별 평가되도록 서브쿼리 구조로 변경

UPDATE public.facility_reviews fr
SET author_name = s.random_name
FROM (
  SELECT fr_inner.id, 
         (ARRAY['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'])[floor(random() * 10) + 1] || '**' as random_name
  FROM public.facility_reviews fr_inner
  JOIN public.facilities f ON fr_inner.facility_id = f.id::text OR fr_inner.facility_id = f.legacy_id
  WHERE f.type = '상조'
    AND (
      fr_inner.author_name = '익명' 
      OR fr_inner.author_name LIKE '%**' -- 이전 작업으로 일괄 업데이트된 경우 재처리
      OR fr_inner.author_name IS NULL 
      OR fr_inner.author_name = ''
    )
  OFFSET 0 -- Postgres 최적화기가 서브쿼리를 하나의 값으로 통합하지 못하도록 강제
) s
WHERE fr.id = s.id;

-- 확인용 쿼리 (분산 상태 확인)
SELECT author_name, count(*) 
FROM public.facility_reviews fr
JOIN public.facilities f ON fr.facility_id = f.id::text OR fr.facility_id = f.legacy_id
WHERE f.type = '상조'
GROUP BY author_name;