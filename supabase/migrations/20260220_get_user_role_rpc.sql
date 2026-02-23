-- ============================================================
-- get_user_role RPC: 5개 순차 쿼리 → 1개 RPC로 통합
-- 반드시 public.clerk_user_id() 사용 (auth.uid() 절대 금지!)
-- ============================================================

DROP FUNCTION IF EXISTS public.get_user_role(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_role(p_clerk_id TEXT)
RETURNS TABLE(role TEXT, facility_id UUID) AS $$
DECLARE
  v_role TEXT;
  v_facility_id UUID;
BEGIN
  -- 0. profiles 테이블 최우선 확인
  SELECT p.role INTO v_role
  FROM public.profiles p
  WHERE p.clerk_id = p_clerk_id;

  IF v_role IS NOT NULL AND v_role != 'user' THEN
    -- facility_admin이면 시설 ID도 반환
    IF v_role IN ('facility_admin', 'facility_manager') THEN
      SELECT f.id INTO v_facility_id
      FROM public.facilities f
      WHERE f.user_id = p_clerk_id
      LIMIT 1;
    END IF;
    RETURN QUERY SELECT v_role, v_facility_id;
    RETURN;
  END IF;

  -- 1. super_admins 테이블 확인
  IF EXISTS(SELECT 1 FROM public.super_admins WHERE user_id = p_clerk_id AND is_active = true) THEN
    RETURN QUERY SELECT 'super_admin'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- 2. 시설 관리자 확인
  SELECT f.id INTO v_facility_id
  FROM public.facilities f
  WHERE f.user_id = p_clerk_id
  LIMIT 1;

  IF v_facility_id IS NOT NULL THEN
    RETURN QUERY SELECT 'facility_admin'::TEXT, v_facility_id;
    RETURN;
  END IF;

  -- 3-1. 상조 본사 관리자 확인
  IF EXISTS(SELECT 1 FROM public.sangjo_hq_admins WHERE user_id = p_clerk_id) THEN
    RETURN QUERY SELECT 'sangjo_hq_admin'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- 3-2. 상조 지점 관리자 확인
  IF EXISTS(SELECT 1 FROM public.sangjo_users WHERE user_id = p_clerk_id) THEN
    RETURN QUERY SELECT 'sangjo_branch_admin'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- 4. 기본 유저
  RETURN QUERY SELECT 'user'::TEXT, NULL::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- CASCADE로 삭제된 memorial_spaces 정책 재생성
-- get_user_role은 RETURNS TABLE이라 RLS에서 직접 사용 불가 → is_super_admin + facilities 직접 확인
DROP POLICY IF EXISTS "Admin restricted memorial_spaces" ON public.memorial_spaces;
CREATE POLICY "Admin restricted memorial_spaces"
  ON public.memorial_spaces
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.user_id = public.clerk_user_id()
      LIMIT 1
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.user_id = public.clerk_user_id()
      LIMIT 1
    )
  );
