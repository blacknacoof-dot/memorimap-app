
-- [Admin & Favorites Fix] 통합 해결 스크립트

-- 1. super_admins 테이블 생성 및 내 계정 등록 (404 해결)
CREATE TABLE IF NOT EXISTS public.super_admins (
    id TEXT PRIMARY KEY, -- Clerk user_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 내 계정(user_372...) 등록
INSERT INTO public.super_admins (id) 
VALUES ('user_372hdrhv9W5I5X67nlLvUXuz4RM')
ON CONFLICT (id) DO NOTHING;


-- 2. favorites 테이블 컬럼 타입 수정 (406 해결)
-- facility_id -> UUID, user_id -> TEXT (Clerk ID 호환)
-- 주의: 기존 데이터 캐스팅 불가 시, 에러가 발생할 수 있습니다. 
-- 그럴 경우 아래 두 줄 대신 DROP/ADD 방식을 고려해야 합니다.

-- 만약 facility_id가 이미 UUID라면 에러가 나지 않습니다.
-- 만약 user_id가 이미 TEXT라면 에러가 나지 않습니다.
-- "cannot cast type" 에러 발생 시, 아래 주석을 풀고 DROP/ADD로 진행하세요.
/*
ALTER TABLE public.favorites DROP COLUMN facility_id;
ALTER TABLE public.favorites ADD COLUMN facility_id UUID;
ALTER TABLE public.favorites DROP COLUMN user_id;
ALTER TABLE public.favorites ADD COLUMN user_id TEXT;
*/

-- [일반 변경 시도]
ALTER TABLE public.favorites 
    ALTER COLUMN facility_id TYPE UUID USING facility_id::uuid,
    ALTER COLUMN user_id TYPE TEXT; 

-- RLS 정책 보강 (선택)
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for super_admins" ON public.super_admins FOR SELECT USING (true);
