-- ============================================================
-- 20260226_fix_ending_notes_rls.sql
-- user_ending_notes, user_journey_logs, user_shares RLS 통일
-- 문제: COALESCE(jwt->>'sub', auth.uid()::text) 패턴 → Supabase Auth 호환 이슈
-- 해결: clerk_user_id() 사용으로 통일 (다른 테이블과 동일)
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────
-- 1. user_ending_notes: 기존 정책 모두 제거 → clerk_user_id() 통일
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "ending_notes_select_v2" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_insert_v2" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_update_v2" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_owner_access" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_owner_all" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_select" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_insert" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_update" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_all" ON public.user_ending_notes;

ALTER TABLE public.user_ending_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ending_notes_select_own" ON public.user_ending_notes
  FOR SELECT TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "ending_notes_insert_own" ON public.user_ending_notes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "ending_notes_update_own" ON public.user_ending_notes
  FOR UPDATE TO authenticated
  USING (user_id = public.clerk_user_id())
  WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "ending_notes_super_admin" ON public.user_ending_notes
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- ────────────────────────────────────────────
-- 2. user_journey_logs: 동일 패턴 통일
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "journey_logs_select_v2" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_insert_v2" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_update_v2" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_delete_v2" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_select" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_insert" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_update" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_delete" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_all" ON public.user_journey_logs;

ALTER TABLE public.user_journey_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journey_logs_select_own" ON public.user_journey_logs
  FOR SELECT TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "journey_logs_insert_own" ON public.user_journey_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "journey_logs_update_own" ON public.user_journey_logs
  FOR UPDATE TO authenticated
  USING (user_id = public.clerk_user_id())
  WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "journey_logs_super_admin" ON public.user_journey_logs
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- ────────────────────────────────────────────
-- 3. user_shares: 동일 패턴 통일
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "shares_select_v2" ON public.user_shares;
DROP POLICY IF EXISTS "shares_insert_v2" ON public.user_shares;
DROP POLICY IF EXISTS "shares_update_v2" ON public.user_shares;
DROP POLICY IF EXISTS "shares_delete_v2" ON public.user_shares;
DROP POLICY IF EXISTS "shares_owner_all" ON public.user_shares;

ALTER TABLE public.user_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shares_select_own" ON public.user_shares
  FOR SELECT TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "shares_insert_own" ON public.user_shares
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "shares_update_own" ON public.user_shares
  FOR UPDATE TO authenticated
  USING (user_id = public.clerk_user_id())
  WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY "shares_delete_own" ON public.user_shares
  FOR DELETE TO authenticated
  USING (user_id = public.clerk_user_id());

CREATE POLICY "shares_super_admin" ON public.user_shares
  FOR ALL TO authenticated
  USING (public.is_super_admin());

COMMIT;

-- ────────────────────────────────────────────
-- 검증: COALESCE 패턴이 0건이어야 함
-- ────────────────────────────────────────────
SELECT tablename, policyname, qual::text, with_check::text
FROM pg_policies
WHERE tablename IN ('user_ending_notes', 'user_journey_logs', 'user_shares')
ORDER BY tablename, policyname;
