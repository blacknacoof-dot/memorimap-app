
-- [Favorites] Schema Fix (Forced)
-- ERROR: 42846: cannot cast type bigint to uuid 에러 해결
-- 기존 bigint 데이터를 uuid로 변환할 수 없으므로, 해당 컬럼을 삭제하고 다시 만듭니다.
-- 주의: 기존 '즐겨찾기' 목록은 초기화됩니다.

ALTER TABLE public.favorites DROP COLUMN facility_id;
ALTER TABLE public.favorites ADD COLUMN facility_id UUID;

-- (선택 권장) user_id도 UUID인지 확인이 필요합니다. 만약 bigint라면 아래 주석을 해제하고 실행하세요.
-- ALTER TABLE public.favorites DROP COLUMN user_id;
-- ALTER TABLE public.favorites ADD COLUMN user_id UUID REFERENCES auth.users(id);
