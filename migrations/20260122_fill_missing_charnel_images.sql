-- [Phase 2] 봉안시설(charnel) 빈 이미지 채우기
-- 이미지 없는 211개 시설에 3가지 고화질 기본 이미지를 번갈아가며 배정합니다.

UPDATE public.facilities
SET image_url = CASE (ctid::text::point)[0]::int % 3
    WHEN 0 THEN 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/charnel.jpg'
    WHEN 1 THEN 'https://images.unsplash.com/photo-1518135714426-c18f5fe26967?q=80&w=800'
    ELSE 'https://images.unsplash.com/photo-1471623197343-ccb79a1bd717?q=80&w=800'
END
WHERE 
    type IN ('charnel', 'charnel_house', 'columbarium', 'memorial')
    AND (image_url IS NULL OR image_url = '')
    AND (images IS NULL OR array_length(images, 1) IS NULL);

-- 결과 확인
SELECT count(*) as "여전히_이미지_없는_봉안시설"
FROM public.facilities
WHERE type IN ('charnel', 'charnel_house', 'columbarium', 'memorial')
  AND (image_url IS NULL OR image_url = '');
