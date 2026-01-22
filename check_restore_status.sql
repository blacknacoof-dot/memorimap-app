-- [데이터 복구 전 확인 쿼리]

-- 1. 복구 대상이 되는(legacy_id가 있는) 시설이 몇 개나 있는지 확인
-- (이 숫자가 1,200개 이상이어야 복구가 의미가 있습니다)
SELECT count(*) as "복구_가능_시설_수_legacy_id_있음"
FROM public.facilities 
WHERE legacy_id IS NOT NULL;

-- 2. 현재 이미지가 "없는" 시설 중 복구 대상인 것들 샘플 (이런 애들이 복구됩니다)
SELECT name, address, legacy_id 
FROM public.facilities 
WHERE legacy_id IS NOT NULL 
  AND (image_url IS NULL OR image_url = '')
LIMIT 5;

-- 3. (참고) 현재 이미지가 이미 있는 시설 수
SELECT count(*) as "이미_사진_있는_시설_수"
FROM public.facilities 
WHERE image_url IS NOT NULL 
   OR (images IS NOT NULL AND array_length(images, 1) > 0);
