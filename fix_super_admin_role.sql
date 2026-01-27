-- ========================================================
-- 매출 통계 복구 및 슈퍼 관리자 권한 보정 스크립트
-- ========================================================

-- 1. 관리자 계정에 슈퍼 관리자 권한 부여 (profiles 테이블)
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'blacknacoof@gmail.com';

-- 2. is_super_admin 함수 수정 (Clerk ID 호환성 확보)
-- auth.uid() 대신 (auth.jwt() ->> 'sub') 사용하여 UUID 캐스팅 오류 방지
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (auth.jwt() ->> 'sub')
        AND role = 'super_admin'
    );
EXCEPTION 
    WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 권한 부여 (필요한 경우)
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon;

-- 4. 업데이트 결과 확인
SELECT id, email, role FROM public.profiles WHERE email = 'blacknacoof@gmail.com';

-- 5. 매출 데이터 존재 여부 최종 확인
SELECT count(*), sum(amount) as total_revenue FROM public.subscription_payments;
