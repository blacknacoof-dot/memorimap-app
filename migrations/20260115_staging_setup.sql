
-- [1] Staging Table 생성 (임시 저장소)
-- 모든 데이터를 일단 여기로 모읍니다. 제약조건 없이 TEXT 위주로 생성하여 에러를 방지합니다.
CREATE TABLE IF NOT EXISTS public.facilities_staging (
    id SERIAL PRIMARY KEY,
    source_file TEXT, -- 데이터 출처 (예: 'backup_2025.csv', '서울_장례식장.csv')
    
    -- 표준화된 컬럼
    name TEXT,
    category TEXT,
    address TEXT,
    phone TEXT,
    
    -- 원본 데이터 보존 (JSONB)
    raw_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [2] Merge & Deduplication Logic (실제 실행은 데이터 적재 후 별도로 진행)
-- 사용 예시:
/*
INSERT INTO public.facilities (name, category, address, location, is_verified)
SELECT DISTINCT ON (name, address)
    name,
    CASE 
        WHEN category LIKE '%장례%' THEN 'funeral_home'::facility_type
        WHEN category LIKE '%봉안%' THEN 'charnel_house'::facility_type
        ELSE 'charnel_house'::facility_type
    END as category,
    address,
    ST_SetSRID(ST_MakePoint(0, 0), 4326), -- 위치는 추후 지오코딩 필요
    TRUE
FROM public.facilities_staging
ORDER BY name, address, created_at DESC;
*/
