-- ============================================================
-- partner_operations RLS 정책 수정 + 누락 컬럼 추가
-- ============================================================
-- 문제 1: sangjo_hq_admin 역할이 정책에 누락 → 본사 관리자 조회/수정 불가
-- 문제 2: auth.jwt() 직접 사용 → 프로젝트 표준 clerk_user_id() 미사용
-- 문제 3: 회사별 격리 없음 → sangjo_manager가 모든 회사 데이터 접근 가능
-- 문제 4: contract_id, completion_time 컬럼 DB에 미존재 (타입만 존재)
-- 해결: sangjo_contracts RLS와 동일 패턴(sangjo_hq_admins JOIN) 적용
-- ============================================================

-- ─────────────────────────────────────────────
-- Step 1: 누락 컬럼 추가
-- ─────────────────────────────────────────────
ALTER TABLE public.partner_operations
  ADD COLUMN IF NOT EXISTS contract_id UUID,
  ADD COLUMN IF NOT EXISTS completion_time TIMESTAMPTZ;

-- ─────────────────────────────────────────────
-- Step 2: 기존 정책 제거
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "partner_operations_manage_admin" ON public.partner_operations;
DROP POLICY IF EXISTS "partner_operations_insert_partner" ON public.partner_operations;

-- ─────────────────────────────────────────────
-- Step 3: 새 정책 생성 (sangjo_contracts_*_v2 패턴 동일)
-- ─────────────────────────────────────────────

-- SELECT: super_admin + 해당 회사 관리자 (sangjo_hq_admins 기준)
CREATE POLICY "partner_operations_select_v2"
  ON public.partner_operations FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.sangjo_hq_admins
      WHERE sangjo_hq_admins.sangjo_id = partner_operations.partner_id::text
        AND sangjo_hq_admins.user_id::text = public.clerk_user_id()
    )
  );

-- INSERT: super_admin + 해당 회사 관리자
CREATE POLICY "partner_operations_insert_v2"
  ON public.partner_operations FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.sangjo_hq_admins
      WHERE sangjo_hq_admins.sangjo_id = partner_operations.partner_id::text
        AND sangjo_hq_admins.user_id::text = public.clerk_user_id()
    )
  );

-- UPDATE: super_admin + 해당 회사 관리자 (단계 변경 등)
CREATE POLICY "partner_operations_update_v2"
  ON public.partner_operations FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.sangjo_hq_admins
      WHERE sangjo_hq_admins.sangjo_id = partner_operations.partner_id::text
        AND sangjo_hq_admins.user_id::text = public.clerk_user_id()
    )
  );
