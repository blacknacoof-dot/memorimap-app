-- ========================================================
-- [데이터 정제] 오등록된 가비지 데이터(식당 등) 삭제
-- ========================================================

-- 1. 장례/추모 시설과 관련 없는 가비지 데이터 키워드 정의 및 삭제
-- 대상 키워드: 식당, 카페, 편의점, 충전소, 주차장, 숙박시설, 일반 상가 등
DELETE FROM public.memorial_spaces 
WHERE 
    -- 식당/카페
    name ILIKE '%동태탕%' OR name ILIKE '%해장국%' OR name ILIKE '%식당%' OR 
    name ILIKE '%카페%' OR name ILIKE '%커피%' OR name ILIKE '%베이커리%' OR
    name ILIKE '%음식점%' OR name ILIKE '%맛집%' OR
    -- 편의점/마트
    name ILIKE '%편의점%' OR name ILIKE '%GS25%' OR name ILIKE '%CU%' OR 
    name ILIKE '%세븐일레븐%' OR name ILIKE '%이마트24%' OR name ILIKE '%마트%' OR
    -- 충전소/주차장
    name ILIKE '%충전소%' OR name ILIKE '%전기차%' OR name ILIKE '%주차장%' OR
    -- 숙박/기타
    name ILIKE '%모텔%' OR name ILIKE '%호텔%' OR name ILIKE '%펜션%' OR
    name ILIKE '%노래방%' OR name ILIKE '%피시방%' OR name ILIKE '%당구장%' OR
    -- 부실 데이터 (Placeholder)
    name ILIKE '%---%' OR address ILIKE '%---%';

-- 2. facilities 테이블에서도 동일하게 삭제
DELETE FROM public.facilities 
WHERE 
    name ILIKE '%동태탕%' OR name ILIKE '%해장국%' OR name ILIKE '%식당%' OR 
    name ILIKE '%카페%' OR name ILIKE '%커피%' OR name ILIKE '%베이커리%' OR
    name ILIKE '%음식점%' OR name ILIKE '%맛집%' OR
    name ILIKE '%편의점%' OR name ILIKE '%GS25%' OR name ILIKE '%CU%' OR 
    name ILIKE '%세븐일레븐%' OR name ILIKE '%이마트24%' OR name ILIKE '%마트%' OR
    name ILIKE '%충전소%' OR name ILIKE '%전기차%' OR name ILIKE '%주차장%' OR
    name ILIKE '%모텔%' OR name ILIKE '%호텔%' OR name ILIKE '%펜션%' OR
    name ILIKE '%노래방%' OR name ILIKE '%피시방%' OR name ILIKE '%당구장%' OR
    -- 부실 데이터 (Placeholder)
    name ILIKE '%---%' OR address ILIKE '%---%';

-- 3. 삭제 결과 확인
SELECT count(*) as ms_count FROM public.memorial_spaces WHERE name ILIKE '%동태탕%';
SELECT count(*) as f_count FROM public.facilities WHERE name ILIKE '%동태탕%';
