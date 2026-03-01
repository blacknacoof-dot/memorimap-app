-- ============================================================
-- RLS 인증 패턴 표준화 — stale policy 정리 + clerk_user_id() 통일
-- ============================================================
-- 목적: auth.jwt(), auth.uid()::text 기반 stale 정책 제거
--       모든 정책을 public.clerk_user_id() 기반으로 통일
-- 대상: consultations, favorites, sangjo_favorites, admin_notifications
-- ============================================================

-- ────────────────────────────────────────────
-- 1. consultations: stale 정책 제거
-- (20260202~20260205 마이그레이션에서 생성된 정책 중 20260221에서 미삭제분)
-- 특히 consultations_insert_public (WITH CHECK true)는 보안 위험
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "consultations_insert_public" ON public.consultations;
DROP POLICY IF EXISTS "consultations_owner_all" ON public.consultations;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.consultations;
DROP POLICY IF EXISTS "authenticated_insert_own_consultation" ON public.consultations;
DROP POLICY IF EXISTS "authenticated_select_own_consultation" ON public.consultations;
DROP POLICY IF EXISTS "facility_admin_view_consultations" ON public.consultations;
DROP POLICY IF EXISTS "consultations_insert_owner_only" ON public.consultations;
DROP POLICY IF EXISTS "Users can view own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Facility admins can view facility consultations" ON public.consultations;
DROP POLICY IF EXISTS "Super admins can view all consultations" ON public.consultations;

-- 현재 정책도 DROP 후 재생성 (clerk_user_id() 통일 보장)
DROP POLICY IF EXISTS "consultations_select_own" ON public.consultations;
DROP POLICY IF EXISTS "consultations_insert_own" ON public.consultations;
DROP POLICY IF EXISTS "consultations_update_own" ON public.consultations;
DROP POLICY IF EXISTS "consultations_delete_own" ON public.consultations;
DROP POLICY IF EXISTS "consultations_facility_admin_select" ON public.consultations;
DROP POLICY IF EXISTS "consultations_facility_admin_update" ON public.consultations;
DROP POLICY IF EXISTS "consultations_super_admin_all" ON public.consultations;

CREATE POLICY "consultations_select_own" ON public.consultations
  FOR SELECT TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "consultations_insert_own" ON public.consultations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "consultations_update_own" ON public.consultations
  FOR UPDATE TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "consultations_delete_own" ON public.consultations
  FOR DELETE TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "consultations_facility_admin_select" ON public.consultations
  FOR SELECT TO authenticated
  USING (
    facility_id IN (
      SELECT id::text FROM public.facilities
      WHERE user_id = public.clerk_user_id()
    )
  );

CREATE POLICY "consultations_facility_admin_update" ON public.consultations
  FOR UPDATE TO authenticated
  USING (
    facility_id IN (
      SELECT id::text FROM public.facilities
      WHERE user_id = public.clerk_user_id()
    )
  );

CREATE POLICY "consultations_super_admin_all" ON public.consultations
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- ────────────────────────────────────────────
-- 2. favorites: auth.jwt() → clerk_user_id() 통일
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "fav_select" ON public.favorites;
DROP POLICY IF EXISTS "fav_insert" ON public.favorites;
DROP POLICY IF EXISTS "fav_delete" ON public.favorites;
DROP POLICY IF EXISTS "fav_super_admin_select" ON public.favorites;

CREATE POLICY "fav_select" ON public.favorites
  FOR SELECT TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "fav_insert" ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "fav_delete" ON public.favorites
  FOR DELETE TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "fav_super_admin_select" ON public.favorites
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- anon 권한 제거 (Supabase Auth 전환 후 불필요)
REVOKE INSERT, DELETE ON public.favorites FROM anon;

-- ────────────────────────────────────────────
-- 3. sangjo_favorites: auth.jwt() → clerk_user_id() 통일
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "sangjo_fav_select" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_fav_insert" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_fav_delete" ON public.sangjo_favorites;
DROP POLICY IF EXISTS "sangjo_fav_super_admin_select" ON public.sangjo_favorites;

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

-- ────────────────────────────────────────────
-- 4. admin_notifications: auth.uid()::text → clerk_user_id() 통일
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "admin_notifications_select_own" ON public.admin_notifications;

CREATE POLICY "admin_notifications_select_own" ON public.admin_notifications
  FOR SELECT TO authenticated
  USING (public.clerk_user_id() = user_id OR public.is_super_admin());
