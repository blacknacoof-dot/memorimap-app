-- ============================================================
-- 20260223_medium_remaining_fixes.sql
-- MEDIUM 잔존 4건 수정
-- ============================================================

BEGIN;

-- ============================================================
-- MED-R1: favorites / sangjo_favorites RLS 일관성 통일
-- 현재: auth.jwt() ->> 'sub' = user_id (Clerk 시절 패턴)
-- 수정: clerk_user_id() = user_id (Supabase Auth 표준 패턴)
-- anon GRANT 제거 (Supabase Auth에서는 인증 세션 필수)
-- ============================================================

-- favorites: 기존 정책 제거
DROP POLICY IF EXISTS "fav_select" ON public.favorites;
DROP POLICY IF EXISTS "fav_insert" ON public.favorites;
DROP POLICY IF EXISTS "fav_delete" ON public.favorites;

-- favorites: clerk_user_id() 기반 재생성
CREATE POLICY "fav_select" ON public.favorites
  FOR SELECT TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "fav_insert" ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "fav_delete" ON public.favorites
  FOR DELETE TO authenticated
  USING (user_id = public.clerk_user_id());

-- favorites: super_admin 조회 (관리 목적)
CREATE POLICY "fav_super_admin_select" ON public.favorites
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- favorites: anon 권한 제거 (Supabase Auth 전환 후 불필요)
REVOKE INSERT, DELETE ON public.favorites FROM anon;

-- sangjo_favorites: 기존 정책 제거
DROP POLICY IF EXISTS "sangjo_fav_select" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_fav_insert" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_fav_delete" ON public.sangjo_favorites;

-- sangjo_favorites: clerk_user_id() 기반 재생성
CREATE POLICY "sangjo_fav_select" ON public.sangjo_favorites
  FOR SELECT TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "sangjo_fav_insert" ON public.sangjo_favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "sangjo_fav_delete" ON public.sangjo_favorites
  FOR DELETE TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "sangjo_fav_super_admin_select" ON public.sangjo_favorites
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

REVOKE INSERT, DELETE ON public.sangjo_favorites FROM anon;

-- ============================================================
-- MED-R2: partner_inquiries INSERT 정책 인증 제한
-- 현재: "Enable insert for all users" WITH CHECK (true) → 비인증 삽입 가능
-- 수정: authenticated만 INSERT 허용
-- ============================================================

DROP POLICY IF EXISTS "Enable insert for all users" ON public.partner_inquiries;
DROP POLICY IF EXISTS "partner_inquiries_insert_authenticated" ON public.partner_inquiries;

CREATE POLICY "partner_inquiries_insert_authenticated"
  ON public.partner_inquiries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- MED-R3: system_logs INSERT 정책 anon 제거
-- 현재: "system_logs_insert_anon_and_auth" TO anon, authenticated
-- 수정: service_role + authenticated만 허용 (로그 위조 방지)
-- ============================================================

DROP POLICY IF EXISTS "system_logs_insert_anon_and_auth" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert_service" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert_authenticated" ON public.system_logs;

CREATE POLICY "system_logs_insert_service"
  ON public.system_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "system_logs_insert_authenticated"
  ON public.system_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- MED-R4: prevent_role_self_escalation() SET search_path 추가
-- 현재: SECURITY DEFINER만 있고 SET search_path 누락
-- 수정: SET search_path = public 추가 (search_path 조작 방지)
-- 트리거는 기존 것 유지 (함수만 재정의)
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
        RETURN NEW;
    END IF;

    IF current_setting('role', true) != 'service_role' THEN
        RAISE EXCEPTION 'Role changes are not allowed. Contact an administrator.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
