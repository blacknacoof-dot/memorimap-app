-- [Step 1] facilities 테이블에 target_audience 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'facilities' AND column_name = 'target_audience'
    ) THEN
        ALTER TABLE public.facilities 
        ADD COLUMN target_audience TEXT DEFAULT 'HUMAN';
    END IF;
END $$;

-- [Step 2] facilities 테이블 업데이트 (category 컬럼 사용)
UPDATE public.facilities
SET
    category = 'pet_funeral',           -- ✅ 이 컬럼만 존재함
    target_audience = 'PET'              -- ✅ Step 1에서 추가됨
WHERE
    category = 'funeral_home'            -- ✅ 기존 컬럼 이름 사용
    AND (
        name LIKE '%펫%'
        OR name LIKE '%동물%'
        OR name LIKE '%강아지%'
        OR name LIKE '%21그램%'
        OR name LIKE '%포레스트%'
    );

-- [Step 3] memorial_spaces 테이블 업데이트 (변경 없음)
UPDATE public.memorial_spaces
SET
    category = '동물장례'
WHERE
    category = '장례식장'
    AND (
        name LIKE '%펫%'
        OR name LIKE '%동물%'
        OR name LIKE '%강아지%'
        OR name LIKE '%21그램%'
        OR name LIKE '%포레스트%'
    );

-- [Step 4] 결과 확인
SELECT 
    'Facilities - Pet Funeral' as description, 
    count(*) as count 
FROM public.facilities 
WHERE category = 'pet_funeral' OR target_audience = 'PET'
UNION ALL
SELECT 
    'Facilities - Human Funeral', 
    count(*) 
FROM public.facilities 
WHERE category = 'funeral_home' AND target_audience = 'HUMAN'
UNION ALL
SELECT 
    'Memorial Spaces - Pet', 
    count(*) 
FROM public.memorial_spaces 
WHERE category = '동물장례';
