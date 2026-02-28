-- ============================================================
-- sangjo_contracts SELECT/UPDATE RLS 수정
-- ============================================================
-- 문제 1: SELECT 정책이 clerk_user_id() = sangjo_id로 비교
--          sangjo_id는 회사 UUID이므로 절대 일치 안 함
--          → 일반 유저 INSERT 후 RETURNING 빈 배열
--          → useFacilityChat .single() PGRST116 에러
--          → 파트너 대시보드 상담 조회 불가
-- 문제 2: UPDATE 정책이 super_admin만 허용
--          → 파트너가 상담 답변 전송 실패
-- ============================================================

-- 1. SELECT: super_admin + 해당 회사 관리자
DROP POLICY IF EXISTS "sangjo_contracts_select_restricted" ON public.sangjo_contracts;
DROP POLICY IF EXISTS "sangjo_contracts_select" ON public.sangjo_contracts;
DROP POLICY IF EXISTS "sangjo_contracts_select_v2" ON public.sangjo_contracts;

CREATE POLICY "sangjo_contracts_select_v2"
  ON public.sangjo_contracts FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.sangjo_hq_admins
      WHERE sangjo_hq_admins.sangjo_id = sangjo_contracts.sangjo_id
        AND sangjo_hq_admins.user_id::text = public.clerk_user_id()
    )
  );

-- 2. UPDATE: super_admin + 해당 회사 관리자 (상담 답변 등)
DROP POLICY IF EXISTS "sangjo_contracts_update" ON public.sangjo_contracts;
DROP POLICY IF EXISTS "sangjo_contracts_update_v2" ON public.sangjo_contracts;

CREATE POLICY "sangjo_contracts_update_v2"
  ON public.sangjo_contracts FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.sangjo_hq_admins
      WHERE sangjo_hq_admins.sangjo_id = sangjo_contracts.sangjo_id
        AND sangjo_hq_admins.user_id::text = public.clerk_user_id()
    )
  );
