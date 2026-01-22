-- [공원묘지, 동물장례, 해양장 이미지 미보유 건수 확인]
SELECT
    CASE 
        WHEN type IN ('park_cemetery', 'park', 'complex', 'cemetery') THEN '공원묘지 (Park)'
        WHEN type IN ('pet_funeral', 'pet', 'pet_memorial') THEN '동물장례 (Pet)'
        WHEN type IN ('sea_burial', 'sea') THEN '해양장 (Sea)'
        ELSE type
    END as category,
    COUNT(*) as "이미지_없는_곳_수"
FROM facilities
WHERE 
    (image_url IS NULL OR TRIM(image_url) = '')
    AND (images IS NULL OR array_length(images, 1) IS NULL)
    AND type IN (
        'park_cemetery', 'park', 'complex', 'cemetery',
        'pet_funeral', 'pet', 'pet_memorial',
        'sea_burial', 'sea'
    )
GROUP BY 
    CASE 
        WHEN type IN ('park_cemetery', 'park', 'complex', 'cemetery') THEN '공원묘지 (Park)'
        WHEN type IN ('pet_funeral', 'pet', 'pet_memorial') THEN '동물장례 (Pet)'
        WHEN type IN ('sea_burial', 'sea') THEN '해양장 (Sea)'
        ELSE type
    END
ORDER BY "이미지_없는_곳_수" DESC;
