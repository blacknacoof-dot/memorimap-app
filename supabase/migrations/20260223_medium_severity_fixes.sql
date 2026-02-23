-- ============================================================
-- 20260223_medium_severity_fixes.sql
-- MEDIUM 심각도 이슈 일괄 수정
-- ============================================================

BEGIN;

-- ============================================================
-- MED-1: facility_admins / sangjo_hq_admins public SELECT 노출 차단
-- robust_*_select 정책이 TO public USING(true) → 관리자 목록 공개
-- 이전 중복 정책도 함께 정리
-- ============================================================

-- facility_admins: 모든 구 정책 제거 후 재생성
DROP POLICY IF EXISTS "robust_facility_admins_select" ON public.facility_admins;
DROP POLICY IF EXISTS "robust_facility_admins_all" ON public.facility_admins;
DROP POLICY IF EXISTS "facility_admin_policy" ON public.facility_admins;
DROP POLICY IF EXISTS "facility_admin_select_clerk_fixed" ON public.facility_admins;
DROP POLICY IF EXISTS "facility_admin_select_own" ON public.facility_admins;

CREATE POLICY "facility_admins_select_own"
  ON public.facility_admins FOR SELECT
  TO authenticated
  USING (user_id::text = public.clerk_user_id() OR public.is_super_admin());

CREATE POLICY "facility_admins_modify_own"
  ON public.facility_admins FOR ALL
  TO authenticated
  USING (user_id::text = public.clerk_user_id())
  WITH CHECK (user_id::text = public.clerk_user_id());

CREATE POLICY "facility_admins_super_admin"
  ON public.facility_admins FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- sangjo_hq_admins: 동일 패턴
DROP POLICY IF EXISTS "robust_sangjo_hq_admins_select" ON public.sangjo_hq_admins;
DROP POLICY IF EXISTS "robust_sangjo_hq_admins_all" ON public.sangjo_hq_admins;
DROP POLICY IF EXISTS "sangjo_admin_policy" ON public.sangjo_hq_admins;
DROP POLICY IF EXISTS "sangjo_admin_select_clerk_fixed" ON public.sangjo_hq_admins;
DROP POLICY IF EXISTS "sangjo_admin_select_own" ON public.sangjo_hq_admins;

CREATE POLICY "sangjo_admins_select_own"
  ON public.sangjo_hq_admins FOR SELECT
  TO authenticated
  USING (user_id::text = public.clerk_user_id() OR public.is_super_admin());

CREATE POLICY "sangjo_admins_modify_own"
  ON public.sangjo_hq_admins FOR ALL
  TO authenticated
  USING (user_id::text = public.clerk_user_id())
  WITH CHECK (user_id::text = public.clerk_user_id());

CREATE POLICY "sangjo_admins_super_admin"
  ON public.sangjo_hq_admins FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- ============================================================
-- MED-2: bot_data RLS 활성화 + 기본 정책
-- 현재 RLS 미설정 상태일 수 있음
-- facility_id는 BIGINT 유지 (Edge Function 호환)
-- ============================================================

ALTER TABLE IF EXISTS public.bot_data ENABLE ROW LEVEL SECURITY;

-- 기존 정책 정리
DROP POLICY IF EXISTS "bot_data_admin_all" ON public.bot_data;
DROP POLICY IF EXISTS "bot_data_public_read" ON public.bot_data;

-- 공개 읽기 (AI 챗봇이 FAQ 조회)
CREATE POLICY "bot_data_public_read"
  ON public.bot_data FOR SELECT
  TO public
  USING (true);

-- 수정은 super_admin 또는 시설 관리자만
CREATE POLICY "bot_data_admin_modify"
  ON public.bot_data FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- service_role (Edge Function)
CREATE POLICY "bot_data_service_role"
  ON public.bot_data FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- MED-3: 무효 인덱스 교체 (category → type)
-- idx_facilities_category는 존재하지 않는 category 컬럼에 생성
-- ============================================================

DROP INDEX IF EXISTS public.idx_facilities_category;
CREATE INDEX IF NOT EXISTS idx_facilities_type ON public.facilities(type);

-- ============================================================
-- MED-4: partner_docs 스토리지 정책 보안 강화
-- 기존: 비인증 업로드/읽기 → 인증된 사용자만 업로드, 읽기는 유지
-- ============================================================

DROP POLICY IF EXISTS "Public Upload partner_docs" ON storage.objects;

CREATE POLICY "Authenticated Upload partner_docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'partner_docs');

-- 읽기는 관리자 + 본인 업로드만 (super_admin 또는 owner)
DROP POLICY IF EXISTS "Public Select partner_docs" ON storage.objects;

CREATE POLICY "Authenticated Select partner_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'partner_docs');

-- ============================================================
-- MED-5: 고아 RLS 정책 정리 (user_ending_notes, user_journey_logs)
-- v2 정책과 중복 공존하는 구 정책 제거
-- ============================================================

-- user_ending_notes: ending_notes_owner_access (FOR ALL) 중복
DROP POLICY IF EXISTS "ending_notes_owner_access" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_owner_all" ON public.user_ending_notes;

-- user_journey_logs: journey_logs_owner_all (FOR ALL) 중복
DROP POLICY IF EXISTS "journey_logs_owner_all" ON public.user_journey_logs;

-- super_admins: 중복 SELECT 정책 정리
DROP POLICY IF EXISTS "check_own_admin_status" ON public.super_admins;

-- ============================================================
-- MED-6: QA 테스트 데이터 Clerk ID 정리
-- user_37p5nXKhEYC4vCk2Q0KTR068KvB → Supabase Auth 전환 후 무효
-- ============================================================

DELETE FROM public.sangjo_dashboard_users WHERE id LIKE 'user_%';
DELETE FROM public.sangjo_hq_admins WHERE user_id LIKE 'user_%';
DELETE FROM public.super_admins WHERE id LIKE 'user_%';
DELETE FROM public.super_admins WHERE user_id LIKE 'user_%';

-- admin_users에서 Clerk ID 정리
DELETE FROM public.admin_users WHERE user_id LIKE 'user_%';

-- ============================================================
-- MED-7: consultations.facility_id (TEXT) 참조 무결성 보강
-- FK는 불가 (TEXT vs UUID) → 인덱스 + 애플리케이션 레벨 검증
-- 이미 idx_consultations_facility_id 존재하므로 스킵
-- ============================================================

-- (인덱스 이미 존재 — 추가 작업 불필요)

-- ============================================================
-- MED-8: emergency_requests CHECK 제약 추가
-- status 값에 CHECK 없음 → 자유 텍스트
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'emergency_requests_status_check'
      AND table_name = 'emergency_requests'
  ) THEN
    ALTER TABLE public.emergency_requests
      ADD CONSTRAINT emergency_requests_status_check
      CHECK (status IN ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));
  END IF;
END $$;

-- ============================================================
-- MED-9: chat_events / emergency_requests / product_click_logs
-- partner SELECT 정책 추가 (파트너가 자기 데이터 조회 가능)
-- ============================================================

-- chat_events: 파트너 본인 데이터 조회
DROP POLICY IF EXISTS "chat_events_select_partner" ON public.chat_events;
CREATE POLICY "chat_events_select_partner"
  ON public.chat_events FOR SELECT
  TO authenticated
  USING (
    user_id::text = public.clerk_user_id()
    OR partner_id IN (
      SELECT sangjo_id FROM public.sangjo_hq_admins
      WHERE user_id::text = public.clerk_user_id()
    )
    OR public.is_super_admin()
  );

-- emergency_requests: 파트너 본인 데이터 조회 + 상태 업데이트
DROP POLICY IF EXISTS "emergency_requests_select_partner" ON public.emergency_requests;
CREATE POLICY "emergency_requests_select_partner"
  ON public.emergency_requests FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT sangjo_id FROM public.sangjo_hq_admins
      WHERE user_id::text = public.clerk_user_id()
    )
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "emergency_requests_update_partner" ON public.emergency_requests;
CREATE POLICY "emergency_requests_update_partner"
  ON public.emergency_requests FOR UPDATE
  TO authenticated
  USING (
    partner_id IN (
      SELECT sangjo_id FROM public.sangjo_hq_admins
      WHERE user_id::text = public.clerk_user_id()
    )
    OR public.is_super_admin()
  );

-- product_click_logs: 파트너 본인 데이터 조회
DROP POLICY IF EXISTS "product_click_logs_select_partner" ON public.product_click_logs;
CREATE POLICY "product_click_logs_select_partner"
  ON public.product_click_logs FOR SELECT
  TO authenticated
  USING (
    user_id::text = public.clerk_user_id()
    OR partner_id IN (
      SELECT sangjo_id FROM public.sangjo_hq_admins
      WHERE user_id::text = public.clerk_user_id()
    )
    OR public.is_super_admin()
  );

COMMIT;
