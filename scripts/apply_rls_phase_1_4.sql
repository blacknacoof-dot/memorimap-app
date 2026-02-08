-- Phase 1-4: RLS Policy Application
-- [CRITICAL] 기존 정책 백업 후 적용

-- ============================================
-- STEP 0: 기존 정책 백업
-- ============================================
-- CREATE TABLE rls_policies_backup_20260208 AS 
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- ============================================
-- STEP 1: profiles 테이블 RLS 강화
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (
    auth.jwt() ->> 'sub' = clerk_id::text
    OR 
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE id = auth.jwt() ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.jwt() ->> 'sub' = clerk_id::text);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = clerk_id::text);

-- ============================================
-- STEP 2: partner_conversations RLS
-- ============================================
ALTER TABLE partner_conversations ENABLE ROW LEVEL SECURITY;

-- [Security Fix] 기존 정책 삭제
DROP POLICY IF EXISTS "partner_conversations_select_own" ON partner_conversations;
DROP POLICY IF EXISTS "partner_conversations_insert_authenticated" ON partner_conversations;
DROP POLICY IF EXISTS "partner_conversations_manage_admin" ON partner_conversations;
DROP POLICY IF EXISTS "Partners can view own conversations" ON partner_conversations;
DROP POLICY IF EXISTS "Partners can insert own conversations" ON partner_conversations;
DROP POLICY IF EXISTS "Partners can update own conversations" ON partner_conversations;

-- SELECT: 파트너 본인 OR 사용자 본인 OR Super Admin
CREATE POLICY "partner_conversations_select_policy" ON partner_conversations
  FOR SELECT
  USING (
    -- 파트너가 자신의 대화 조회
    (auth.jwt() ->> 'sub')::uuid = partner_id
    OR
    -- 사용자가 자신의 대화 조회
    (auth.jwt() ->> 'sub')::uuid = user_id
    OR 
    -- Super Admin 또는 Sangjo Manager
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (auth.jwt() ->> 'sub')::uuid
      AND p.role IN ('super_admin', 'sangjo_manager')
    )
  );

-- INSERT: 인증된 사용자 (partner_id 또는 user_id 일치)
CREATE POLICY "partner_conversations_insert_policy" ON partner_conversations
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'sub')::uuid = partner_id
    OR
    (auth.jwt() ->> 'sub')::uuid = user_id
  );

-- UPDATE: 파트너 본인 OR Super Admin
CREATE POLICY "partner_conversations_update_policy" ON partner_conversations
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'sub')::uuid = partner_id
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (auth.jwt() ->> 'sub')::uuid
      AND p.role IN ('super_admin', 'sangjo_manager')
    )
  );

-- ============================================
-- STEP 3: consultations RLS
-- ============================================
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Facility admins can view consultations" ON consultations;
CREATE POLICY "Facility admins can view consultations" ON consultations
  FOR SELECT
  USING (
    -- 시설 소유자
    EXISTS (
      SELECT 1 FROM facilities 
      WHERE id::text = consultations.facility_id::text
      AND user_id = auth.jwt() ->> 'sub'
    )
    OR
    -- 작성자 본인
    auth.jwt() ->> 'sub' = user_id::text
    OR
    -- Super Admin
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE id = auth.jwt() ->> 'sub'
    )
  );

DROP POLICY IF EXISTS "Users can create consultations" ON consultations;
CREATE POLICY "Users can create consultations" ON consultations
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'sub' = user_id::text
    OR auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Facility admins can update consultations" ON consultations;
CREATE POLICY "Facility admins can update consultations" ON consultations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM facilities 
      WHERE id::text = consultations.facility_id::text
      AND user_id = auth.jwt() ->> 'sub'
    )
    OR
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE id = auth.jwt() ->> 'sub'
    )
  );

-- ============================================
-- STEP 4: facilities RLS (업데이트 정책 강화)
-- ============================================
-- SELECT는 public이므로 수정 불필요

DROP POLICY IF EXISTS "Facility owners can update facilities" ON facilities;
CREATE POLICY "Facility owners can update facilities" ON facilities
  FOR UPDATE
  USING (
    auth.jwt() ->> 'sub' = user_id::text
    OR
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE id = auth.jwt() ->> 'sub'
    )
  );
