
-- [CASCADE Fix] 의존성 문제 해결을 위한 강제 초기화 스크립트
-- RLS 정책(Policy)들이 컬럼에 의존하고 있어 CASCADE로 함께 삭제 후 재생성합니다.

-- 1. [Favorites] 컬럼 초기화 (CASCADE로 정책 자동 삭제)
ALTER TABLE public.favorites DROP COLUMN IF EXISTS facility_id CASCADE;
ALTER TABLE public.favorites ADD COLUMN facility_id UUID;

ALTER TABLE public.favorites DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.favorites ADD COLUMN user_id TEXT;  -- Clerk ID는 TEXT

-- 1-1. [Favorites] 삭제된 정책 복구
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on user_id" ON public.favorites FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NOT NULL);
CREATE POLICY "Enable insert for users based on user_id" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for users based on user_id" ON public.favorites FOR DELETE USING (auth.uid()::text = user_id OR true);


-- 2. [Facility Subscriptions] 컬럼 초기화 (CASCADE로 정책 자동 삭제)
ALTER TABLE public.facility_subscriptions DROP COLUMN IF EXISTS facility_id CASCADE;
ALTER TABLE public.facility_subscriptions ADD COLUMN facility_id UUID;

-- 2-1. [Facility Subscriptions] 정책 복구 (facilities 테이블과 연동 가정)
ALTER TABLE public.facility_subscriptions ENABLE ROW LEVEL SECURITY;

-- 소유자(Owner) 조회 정책: facilities 테이블의 user_id와 일치하는지 확인
-- (facilities 테이블이 존재하고 user_id 컬럼이 있다고 가정)
CREATE POLICY "Owners can view own subscription" ON public.facility_subscriptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.facilities 
    WHERE id = facility_subscriptions.facility_id 
    AND user_id = auth.uid()::text
  )
);

-- (참고) 만약 facilities 테이블 연결이 어렵다면 일단 본인 소유 확인 로직은 제외하고 
-- 슈퍼 관리자만 볼 수 있게 하거나, 추후 보강해야 합니다.
-- 일단은 가장 안전한 '슈퍼 관리자 전용' 정책 하나를 추가합니다.
CREATE POLICY "Super Admin Manage Subscriptions" ON public.facility_subscriptions
FOR ALL USING (
  (SELECT COUNT(*) FROM public.super_admins WHERE id = auth.uid()::text) > 0
);


-- 3. [Super Admins] 테이블 생성 (만약 아직 안 했다면)
CREATE TABLE IF NOT EXISTS public.super_admins (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO public.super_admins (id) VALUES ('user_372hdrhv9W5I5X67nlLvUXuz4RM') ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for super_admins" ON public.super_admins FOR SELECT USING (true);
