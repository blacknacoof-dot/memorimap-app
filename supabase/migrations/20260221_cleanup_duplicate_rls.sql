-- ============================================================
-- CLEANUP: reservations, consultations, leads 중복/구 RLS 정책 제거
-- 신규 정책(clerk_user_id 기반)만 남기고 나머지 삭제
-- Date: 2026-02-21
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────
-- 1. consultations 구 정책 제거
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "consultations_select" ON consultations;
DROP POLICY IF EXISTS "consultations_insert" ON consultations;
DROP POLICY IF EXISTS "consultations_update" ON consultations;
DROP POLICY IF EXISTS "consultations_delete" ON consultations;
DROP POLICY IF EXISTS "consultations_insert_authenticated" ON consultations;

-- ────────────────────────────────────────────
-- 2. leads 구 정책 제거
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins view all leads" ON leads;
DROP POLICY IF EXISTS "Allow public select" ON leads;
DROP POLICY IF EXISTS "leads_insert_anon_and_auth" ON leads;

-- ────────────────────────────────────────────
-- 3. reservations 구 정책 제거
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Facility owners can update reservations" ON reservations;
DROP POLICY IF EXISTS "Facility owners can view reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can cancel their reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "reservations_select" ON reservations;
DROP POLICY IF EXISTS "reservations_insert" ON reservations;
DROP POLICY IF EXISTS "reservations_update" ON reservations;
DROP POLICY IF EXISTS "reservations_delete" ON reservations;
DROP POLICY IF EXISTS "reservations_insert_authenticated" ON reservations;

COMMIT;

-- ────────────────────────────────────────────
-- 검증: 각 테이블에 남은 정책 확인
-- ────────────────────────────────────────────
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('reservations', 'consultations', 'leads')
ORDER BY tablename, policyname;
