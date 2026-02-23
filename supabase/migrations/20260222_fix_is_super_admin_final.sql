-- =============================================
-- 20260222_fix_is_super_admin_final.sql
-- P0 FIX: is_super_admin() 함수 profiles 테이블 기준으로 통일
-- 20260221_db_fixes_batch1.sql이 admin_users 테이블로 잘못 덮어쓴 것을 복원
-- =============================================

-- 1) No-param 버전: RLS 정책에서 사용 (JWT의 clerk_user_id() 자동 추출)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = public.clerk_user_id()
      AND role = 'super_admin'
  );
END;
$$;

-- 2) Param 버전: 명시적 user_id 전달 시 사용 (레거시 호환)
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = p_user_id
      AND role = 'super_admin'
  );
END;
$$;

-- 권한 설정
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(TEXT) TO authenticated;

DO $$ BEGIN RAISE NOTICE 'Fix applied: is_super_admin() both overloads now check profiles table'; END $$;
