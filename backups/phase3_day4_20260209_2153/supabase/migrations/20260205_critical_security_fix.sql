-- =============================================
-- [P0] 치명적 보안 문제 수정 - Phase 1
-- 1. super_admins INSERT 차단 (권한 탈취 방지)
-- 2. is_super_admin RPC 생성 (서버 측 검증)
-- 3. leads 테이블 보안 강화
-- =============================================

BEGIN;

-- #############################################
-- 1. super_admins INSERT 완전 차단
-- #############################################
-- 공격자가 자신의 ID를 INSERT하여 권한 탈취하는 것을 방지

-- 기존 INSERT 정책 모두 제거
DROP POLICY IF EXISTS "super_admins_insert" ON public.super_admins;
DROP POLICY IF EXISTS "Allow authenticated users to insert super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "super_admins_insert_policy" ON public.super_admins;

-- INSERT 완전 차단 (service_role만 허용, 클라이언트 불가)
CREATE POLICY "super_admins_no_client_insert"
ON public.super_admins FOR INSERT
TO authenticated
WITH CHECK (false);

-- SELECT는 본인 레코드만 조회 가능
DROP POLICY IF EXISTS "super_admins_select" ON public.super_admins;
DROP POLICY IF EXISTS "super_admins_select_self" ON public.super_admins;
CREATE POLICY "super_admins_select_self_only"
ON public.super_admins FOR SELECT
TO authenticated
USING (user_id = auth.jwt() ->> 'sub');

-- UPDATE/DELETE도 차단
DROP POLICY IF EXISTS "super_admins_update" ON public.super_admins;
DROP POLICY IF EXISTS "super_admins_delete" ON public.super_admins;
CREATE POLICY "super_admins_no_client_update"
ON public.super_admins FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "super_admins_no_client_delete"
ON public.super_admins FOR DELETE
TO authenticated
USING (false);

-- #############################################
-- 2. is_super_admin RPC 생성 (서버 측 검증)
-- #############################################
-- SECURITY DEFINER로 RLS 우회하여 검증
-- 클라이언트에서 직접 테이블 조회 대신 이 함수 사용

-- 기존 is_super_admin 함수 모두 제거 (시그니처 충돌 방지)
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.is_super_admin(TEXT);
DROP FUNCTION IF EXISTS public.is_super_admin(p_user_id TEXT);

CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = p_user_id AND is_active = true
  );
END;
$$;

-- 함수 접근 권한 제한
REVOKE ALL ON FUNCTION public.is_super_admin FROM public;
GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;

-- #############################################
-- 3. leads 테이블 보안 강화
-- #############################################
-- 기존: TO public WITH CHECK (true) → 누구나 무제한 INSERT 가능
-- 수정: TO authenticated로 변경 (로그인 사용자만 허용)

DROP POLICY IF EXISTS "leads_insert_public" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.leads;

-- 로그인 사용자만 상담 신청 가능
CREATE POLICY "leads_insert_authenticated_only"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (true);

-- 비로그인 상담이 필요한 경우: Edge Function으로 Rate Limiting 적용 권장

COMMIT;

-- 확인 출력
DO $$ BEGIN RAISE NOTICE '✅ Phase 1 보안 패치 완료: super_admins 보호, is_super_admin RPC 생성, leads 보안 강화'; END $$;
