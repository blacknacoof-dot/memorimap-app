-- [데이터 백업 스크립트]
-- 만약의 사태를 대비해 현재 facilities 테이블을 그대로 복제합니다.

CREATE TABLE IF NOT EXISTS public.facilities_backup_20260122 AS 
SELECT * FROM public.facilities;

-- 백업 완료 확인
SELECT count(*) as "백업된_행_수" FROM public.facilities_backup_20260122;
