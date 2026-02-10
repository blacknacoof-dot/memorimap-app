-- ========================================================
-- [긴급 패치] Clerk ID 불일치 해결 및 매출 통계 활성화
-- ========================================================

-- 1. Clerk User ID 기반으로 프로필 생성 또는 업데이트
-- 'user_36usU2NHzHUg14UgoOIK5J1LuKd'는 super_admins 테이블에서 확인된 ID입니다.
INSERT INTO public.profiles (id, email, role, full_name, created_at)
VALUES (
    'user_36usU2NHzHUg14UgoOIK5J1LuKd', 
    'blacknacoof@gmail.com', 
    'super_admin', 
    'Super Admin',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- 2. (옵션) 기존 UUID 기반 프로필도 확인 차원에서 업데이트
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'blacknacoof@gmail.com';

-- 3. is_super_admin 함수 재확인 (Clerk JWT 'sub' 필드를 정확히 참조)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    current_uid TEXT;
BEGIN
    -- JWT에서 sub(Clerk User ID)를 가져옴
    current_uid := auth.jwt() ->> 'sub';
    
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = current_uid
        AND role = 'super_admin'
    );
EXCEPTION 
    WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 매출 데이터 접근 권한을 위해 RLS 정책 재설정
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin Manage All Payments" ON public.subscription_payments;
CREATE POLICY "Super Admin Manage All Payments"
ON public.subscription_payments
FOR ALL
USING (public.is_super_admin());

-- 5. 결과 확인
SELECT id, email, role FROM public.profiles WHERE email = 'blacknacoof@gmail.com';
