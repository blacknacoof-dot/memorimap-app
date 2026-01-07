
-- [Complete Fix] 이미지, 즐겨찾기, 구독 테이블 일괄 수정
-- facility_images 테이블도 facility_id가 BigInt로 되어 있어 에러가 났습니다.
-- 이 스크립트는 관련된 모든 테이블의 컬럼을 UUID로 강제 변경하고 정책을 복구합니다.

-- 1. [Facility Images] 수정 (이미지 안 나오는 문제 해결)
ALTER TABLE public.facility_images DROP COLUMN IF EXISTS facility_id CASCADE;
ALTER TABLE public.facility_images ADD COLUMN facility_id UUID;

-- 이미지 테이블 정책 복구
ALTER TABLE public.facility_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON public.facility_images;
CREATE POLICY "Public Read Access" ON public.facility_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super Admin Manage All" ON public.facility_images;
CREATE POLICY "Super Admin Manage All" ON public.facility_images FOR ALL USING (
  (SELECT COUNT(*) FROM public.super_admins WHERE id = auth.uid()::text) > 0
);


-- 2. [Favorites] 수정 (406 에러 해결 재시도)
ALTER TABLE public.favorites DROP COLUMN IF EXISTS facility_id CASCADE;
ALTER TABLE public.favorites ADD COLUMN facility_id UUID;
ALTER TABLE public.favorites DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.favorites ADD COLUMN user_id TEXT;  -- Clerk ID

-- Favorites 정책 복구
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for users" ON public.favorites;
CREATE POLICY "Enable read for users" ON public.favorites FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Enable insert for users" ON public.favorites;
CREATE POLICY "Enable insert for users" ON public.favorites FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for users" ON public.favorites;
CREATE POLICY "Enable delete for users" ON public.favorites FOR DELETE USING (auth.uid()::text = user_id);


-- 3. [Facility Subscriptions] 수정 (400 에러 해결)
ALTER TABLE public.facility_subscriptions DROP COLUMN IF EXISTS facility_id CASCADE;
ALTER TABLE public.facility_subscriptions ADD COLUMN facility_id UUID;

-- Subscriptions 정책 복구
ALTER TABLE public.facility_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admin All" ON public.facility_subscriptions;
CREATE POLICY "Super Admin All" ON public.facility_subscriptions FOR ALL USING (
  (SELECT COUNT(*) FROM public.super_admins WHERE id = auth.uid()::text) > 0
);


-- 4. [Super Admins] 확인
CREATE TABLE IF NOT EXISTS public.super_admins (id TEXT PRIMARY KEY);
INSERT INTO public.super_admins (id) VALUES ('user_372hdrhv9W5I5X67nlLvUXuz4RM') ON CONFLICT DO NOTHING;
