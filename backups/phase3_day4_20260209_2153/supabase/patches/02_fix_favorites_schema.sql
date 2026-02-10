
-- [Favorites] Schema Fix
-- facility_id가 기존에 bigint 등 다른 타입으로 되어있어 UUID로 변경합니다.
-- 기존 데이터와 호환되지 않을 수 있으므로, 컬럼 타입을 강제로 변경하거나 새로 만듭니다.

-- 안전한 변경을 위해 컬럼 타입을 UUID로 변경 (USING 문법 사용)
-- 만약 데이터가 없어 에러가 난다면 DROP/ADD 방식이 낫지만, 여기서는 ALTER 시도
ALTER TABLE public.favorites 
ALTER COLUMN facility_id TYPE UUID USING facility_id::uuid;
