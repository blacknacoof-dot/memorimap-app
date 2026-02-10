
-- [Integrated Fix] 404, 406, 400 에러 해결을 위한 최종 통합 스크립트

-- 1. [Super Admins] 관리자 테이블 & 내 계정 생성 (404 해결)
CREATE TABLE IF NOT EXISTS public.super_admins (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 내 계정 등록
INSERT INTO public.super_admins (id) 
VALUES ('user_372hdrhv9W5I5X67nlLvUXuz4RM')
ON CONFLICT (id) DO NOTHING;

-- RLS 정책 (선택)
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read for super_admins" ON public.super_admins;
CREATE POLICY "Public read for super_admins" ON public.super_admins FOR SELECT USING (true);


-- 2. [Favorites] 테이블 타입 수정 (406 해결)
-- 기존 facility_id가 bigint라면 에러가 발생하므로, DROP & ADD 방식을 권장합니다.
ALTER TABLE public.favorites DROP COLUMN IF EXISTS facility_id;
ALTER TABLE public.favorites ADD COLUMN facility_id UUID;

ALTER TABLE public.favorites DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.favorites ADD COLUMN user_id TEXT;  -- Clerk ID는 텍스트


-- 3. [Facility Subscriptions] 테이블 타입 수정 (400 해결)
-- facility_subscriptions 테이블도 facility_id가 bigint일 가능성이 높음
-- 에러: invalid input syntax for type bigint: "uuid_string"
ALTER TABLE public.facility_subscriptions DROP COLUMN IF EXISTS facility_id;
ALTER TABLE public.facility_subscriptions ADD COLUMN facility_id UUID;

-- (선택) facility_subscriptions 데이터 보존이 필요하다면 DROP 대신 ALTER를 시도해야 하지만, 
-- 타입 충돌로 실패할 경우 위처럼 DROP이 가장 확실합니다.
-- 개발 단계라면 DROP 후 데이터를 다시 쌓는 것을 권장합니다.
