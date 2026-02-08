-- 간단한 매칭 확인
-- 1. memorial_spaces와 facilities 이름 비교
SELECT 
  ms.id as ms_id,
  ms.name as ms_name,
  f.id as f_id,
  f.name as f_name
FROM memorial_spaces ms
LEFT JOIN facilities f ON ms.name = f.name
ORDER BY ms.id
LIMIT 20;
