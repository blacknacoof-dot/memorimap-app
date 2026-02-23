-- ============================================================
-- FIX: reservations, consultations, leads 테이블 RLS 정책 수정
-- 문제: auth.uid() 사용 → Clerk ID(TEXT)와 타입 불일치 → INSERT/SELECT 실패
-- 해결: public.clerk_user_id() 사용 (TEXT 반환, Clerk JWT sub 클레임 추출)
-- Date: 2026-02-21
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────
-- 1. reservations (user_id: TEXT, Clerk format)
-- ────────────────────────────────────────────
-- 기존 정책 모두 제거
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can insert own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can delete own reservations" ON reservations;
DROP POLICY IF EXISTS "reservations_select_own" ON reservations;
DROP POLICY IF EXISTS "reservations_insert_own" ON reservations;
DROP POLICY IF EXISTS "reservations_update_own" ON reservations;
DROP POLICY IF EXISTS "reservations_delete_own" ON reservations;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON reservations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON reservations;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON reservations;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON reservations;
DROP POLICY IF EXISTS "reservations_all_own" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can insert reservations" ON reservations;
DROP POLICY IF EXISTS "admin_reservations_all" ON reservations;

-- RLS 활성화 (이미 활성화된 경우 무시됨)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 사용자 본인 예약 조회
CREATE POLICY "reservations_select_own" ON reservations
  FOR SELECT
  USING (user_id = public.clerk_user_id());

-- 사용자 본인 예약 생성
CREATE POLICY "reservations_insert_own" ON reservations
  FOR INSERT
  WITH CHECK (user_id = public.clerk_user_id());

-- 사용자 본인 예약 수정 (취소 등)
CREATE POLICY "reservations_update_own" ON reservations
  FOR UPDATE
  USING (user_id = public.clerk_user_id());

-- 사용자 본인 예약 삭제
CREATE POLICY "reservations_delete_own" ON reservations
  FOR DELETE
  USING (user_id = public.clerk_user_id());

-- 시설 관리자: 자기 시설 예약 조회/수정
CREATE POLICY "reservations_facility_admin_select" ON reservations
  FOR SELECT
  USING (
    facility_id IN (
      SELECT id FROM facilities WHERE user_id = public.clerk_user_id()
    )
  );

CREATE POLICY "reservations_facility_admin_update" ON reservations
  FOR UPDATE
  USING (
    facility_id IN (
      SELECT id FROM facilities WHERE user_id = public.clerk_user_id()
    )
  );

-- 슈퍼관리자: 전체 접근
CREATE POLICY "reservations_super_admin_all" ON reservations
  FOR ALL
  USING (public.is_super_admin());

-- ────────────────────────────────────────────
-- 2. consultations (user_id: TEXT, Clerk format)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own consultations" ON consultations;
DROP POLICY IF EXISTS "Users can insert own consultations" ON consultations;
DROP POLICY IF EXISTS "Users can update own consultations" ON consultations;
DROP POLICY IF EXISTS "Users can delete own consultations" ON consultations;
DROP POLICY IF EXISTS "consultations_select_own" ON consultations;
DROP POLICY IF EXISTS "consultations_insert_own" ON consultations;
DROP POLICY IF EXISTS "consultations_update_own" ON consultations;
DROP POLICY IF EXISTS "consultations_delete_own" ON consultations;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON consultations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON consultations;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON consultations;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON consultations;
DROP POLICY IF EXISTS "consultations_all_own" ON consultations;
DROP POLICY IF EXISTS "Authenticated users can insert consultations" ON consultations;
DROP POLICY IF EXISTS "admin_consultations_all" ON consultations;

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- 사용자 본인 상담 조회
CREATE POLICY "consultations_select_own" ON consultations
  FOR SELECT
  USING (user_id = public.clerk_user_id());

-- 사용자 본인 상담 생성
CREATE POLICY "consultations_insert_own" ON consultations
  FOR INSERT
  WITH CHECK (user_id = public.clerk_user_id());

-- 사용자 본인 상담 수정
CREATE POLICY "consultations_update_own" ON consultations
  FOR UPDATE
  USING (user_id = public.clerk_user_id());

-- 사용자 본인 상담 삭제
CREATE POLICY "consultations_delete_own" ON consultations
  FOR DELETE
  USING (user_id = public.clerk_user_id());

-- 시설 관리자: 자기 시설 상담 조회/수정
CREATE POLICY "consultations_facility_admin_select" ON consultations
  FOR SELECT
  USING (
    facility_id IN (
      SELECT id::text FROM facilities WHERE user_id = public.clerk_user_id()
    )
  );

CREATE POLICY "consultations_facility_admin_update" ON consultations
  FOR UPDATE
  USING (
    facility_id IN (
      SELECT id::text FROM facilities WHERE user_id = public.clerk_user_id()
    )
  );

-- 슈퍼관리자: 전체 접근
CREATE POLICY "consultations_super_admin_all" ON consultations
  FOR ALL
  USING (public.is_super_admin());

-- ────────────────────────────────────────────
-- 3. leads (user_id: TEXT, nullable)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert leads" ON leads;
DROP POLICY IF EXISTS "leads_select_own" ON leads;
DROP POLICY IF EXISTS "leads_insert_own" ON leads;
DROP POLICY IF EXISTS "leads_insert_authenticated" ON leads;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON leads;
DROP POLICY IF EXISTS "admin_leads_all" ON leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 사용자 본인 리드 조회
CREATE POLICY "leads_select_own" ON leads
  FOR SELECT
  USING (user_id = public.clerk_user_id());

-- 인증된 사용자 리드 생성 (user_id가 null일 수 있으므로 관대한 정책)
CREATE POLICY "leads_insert_authenticated" ON leads
  FOR INSERT
  WITH CHECK (
    user_id IS NULL OR user_id = public.clerk_user_id()
  );

-- 슈퍼관리자: 전체 접근
CREATE POLICY "leads_super_admin_all" ON leads
  FOR ALL
  USING (public.is_super_admin());

-- 시설 관리자: 자기 시설 리드 조회
CREATE POLICY "leads_facility_admin_select" ON leads
  FOR SELECT
  USING (
    facility_id IN (
      SELECT id::text FROM facilities WHERE user_id = public.clerk_user_id()
    )
  );

COMMIT;

-- ────────────────────────────────────────────
-- 검증: 해당 테이블에 auth.uid() 정책이 0건이어야 함
-- ────────────────────────────────────────────
SELECT tablename, policyname,
  CASE WHEN qual::text LIKE '%auth.uid()%' THEN 'BAD: auth.uid() in USING' ELSE 'OK' END AS using_check,
  CASE WHEN with_check IS NOT NULL AND with_check::text LIKE '%auth.uid()%' THEN 'BAD: auth.uid() in WITH CHECK' ELSE 'OK' END AS withcheck_check
FROM pg_policies
WHERE tablename IN ('reservations', 'consultations', 'leads');
