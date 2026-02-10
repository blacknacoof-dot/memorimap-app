-- ========================================================
-- [최종 패치] Clerk ID 매핑 및 매출 통계 활성화
-- ========================================================

-- 1. 기존 프로필에 Clerk ID 매핑 및 권한 부여
-- email 기반으로 기존 레코드를 찾아 clerk_id를 업데이트합니다.
UPDATE public.profiles 
SET 
    clerk_id = 'user_36usU2NHzHUg14UgoOIK5J1LuKd',
    role = 'super_admin'
WHERE email = 'blacknacoof@gmail.com';

-- 2. 만약 해당 이메일의 레코드가 없었다면 새로 생성 (안전장치)
INSERT INTO public.profiles (id, clerk_id, email, role, full_name, created_at)
SELECT 
    gen_random_uuid(), 
    'user_36usU2NHzHUg14UgoOIK5J1LuKd', 
    'blacknacoof@gmail.com', 
    'super_admin', 
    'Super Admin',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'blacknacoof@gmail.com');

-- 3. is_super_admin 함수 수정 (clerk_id 및 id::text 모두 지원)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    current_claims_sub TEXT;
BEGIN
    -- JWT에서 sub(Clerk User ID)를 가져옴
    current_claims_sub := auth.jwt() ->> 'sub';
    
    IF current_claims_sub IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE (clerk_id = current_claims_sub OR id::text = current_claims_sub)
        AND role = 'super_admin'
    );
EXCEPTION 
    WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 매출 통계 RLS 정책 재설정
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin Manage All Payments" ON public.subscription_payments;
CREATE POLICY "Super Admin Manage All Payments"
ON public.subscription_payments
FOR ALL
USING (public.is_super_admin());

-- 5. 결과 확인
SELECT id, clerk_id, email, role FROM public.profiles WHERE email = 'blacknacoof@gmail.com';
