-- ============================================================
-- 슈퍼관리자 테이블 RLS 정책 추가
-- system_settings, ai_consultations, sangjo_contracts, platform_notices, partners
-- 반드시 public.clerk_user_id() 사용 (auth.uid() 절대 금지!)
-- ============================================================

-- ============================================================
-- 1. system_settings (super_admin 전용)
-- ============================================================
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_settings_super_admin_select" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_super_admin_insert" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_super_admin_update" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_super_admin_delete" ON public.system_settings;

CREATE POLICY "system_settings_super_admin_select"
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "system_settings_super_admin_insert"
  ON public.system_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "system_settings_super_admin_update"
  ON public.system_settings FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "system_settings_super_admin_delete"
  ON public.system_settings FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ============================================================
-- 2. ai_consultations (user_id 컬럼 존재)
-- ============================================================
ALTER TABLE IF EXISTS public.ai_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_consultations_user_select" ON public.ai_consultations;
DROP POLICY IF EXISTS "ai_consultations_user_insert" ON public.ai_consultations;
DROP POLICY IF EXISTS "ai_consultations_user_update" ON public.ai_consultations;
DROP POLICY IF EXISTS "ai_consultations_super_admin_all" ON public.ai_consultations;

CREATE POLICY "ai_consultations_user_select"
  ON public.ai_consultations FOR SELECT
  TO authenticated
  USING (
    public.clerk_user_id() = user_id
    OR public.is_super_admin()
  );

CREATE POLICY "ai_consultations_user_insert"
  ON public.ai_consultations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "ai_consultations_user_update"
  ON public.ai_consultations FOR UPDATE
  TO authenticated
  USING (
    public.clerk_user_id() = user_id
    OR public.is_super_admin()
  );

-- ============================================================
-- 3. sangjo_contracts (user_id 컬럼 없음 → 인증 사용자 접근)
-- ============================================================
ALTER TABLE IF EXISTS public.sangjo_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sangjo_contracts_select" ON public.sangjo_contracts;
DROP POLICY IF EXISTS "sangjo_contracts_insert" ON public.sangjo_contracts;
DROP POLICY IF EXISTS "sangjo_contracts_update" ON public.sangjo_contracts;

-- 조회: 인증된 사용자 (super_admin 포함)
CREATE POLICY "sangjo_contracts_select"
  ON public.sangjo_contracts FOR SELECT
  TO authenticated
  USING (true);

-- 생성: 인증된 사용자
CREATE POLICY "sangjo_contracts_insert"
  ON public.sangjo_contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 수정: 슈퍼관리자만
CREATE POLICY "sangjo_contracts_update"
  ON public.sangjo_contracts FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());

-- ============================================================
-- 4. platform_notices
-- ============================================================
ALTER TABLE IF EXISTS public.platform_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_notices_public_select" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_select" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_super_admin_insert" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_super_admin_update" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_super_admin_delete" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_insert_policy" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_update_policy" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_delete_policy" ON public.platform_notices;

CREATE POLICY "platform_notices_select"
  ON public.platform_notices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "platform_notices_super_admin_insert"
  ON public.platform_notices FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "platform_notices_super_admin_update"
  ON public.platform_notices FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "platform_notices_super_admin_delete"
  ON public.platform_notices FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ============================================================
-- 5. subscription_payments RLS (auth.uid() → clerk_user_id())
-- ============================================================
ALTER TABLE IF EXISTS public.subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_own_payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "subscription_payments_select" ON public.subscription_payments;
DROP POLICY IF EXISTS "subscription_payments_insert" ON public.subscription_payments;

CREATE POLICY "subscription_payments_select"
  ON public.subscription_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "subscription_payments_insert"
  ON public.subscription_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 6. partners (user_id 컬럼 없음 → super_admin 전용)
-- ============================================================
ALTER TABLE IF EXISTS public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_super_admin_update" ON public.partners;
DROP POLICY IF EXISTS "partners_super_admin_select" ON public.partners;
DROP POLICY IF EXISTS "partners_authenticated_select" ON public.partners;
DROP POLICY IF EXISTS "partners_select_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_update_policy" ON public.partners;

-- 슈퍼관리자 전체 조회
CREATE POLICY "partners_super_admin_select"
  ON public.partners FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- 슈퍼관리자 상태 변경 (일시정지 등)
CREATE POLICY "partners_super_admin_update"
  ON public.partners FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());
