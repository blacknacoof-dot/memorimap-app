-- ============================================================
-- 20260223_fix_profiles_select_exposure.sql
-- AUTH-18: profiles SELECT 정책 수정
-- 문제: profiles_public_select 등 6개 정책이 TO public USING(true)
--       → 비인증 사용자 포함 전체 프로필(email, phone, role) 노출
-- 수정: 본인 프로필만 조회 가능 + 슈퍼관리자 전체 조회
--       (profiles_super_admin_all FOR ALL 정책이 이미 존재하므로 SELECT 커버)
-- ============================================================

BEGIN;

-- 1. 기존 public/open SELECT 정책 전부 제거
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "robust_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "robust_profiles_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_anon" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_by_clerk_fixed" ON public.profiles;

-- 2. 본인 프로필만 조회 가능 (authenticated만)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (clerk_id = public.clerk_user_id());

-- 3. 슈퍼관리자 전체 조회는 기존 profiles_super_admin_all (FOR ALL) 정책이 커버
-- 확인: 해당 정책이 없으면 재생성
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'profiles_super_admin_all'
  ) THEN
    CREATE POLICY "profiles_super_admin_all" ON public.profiles
      FOR ALL TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END $$;

COMMIT;
