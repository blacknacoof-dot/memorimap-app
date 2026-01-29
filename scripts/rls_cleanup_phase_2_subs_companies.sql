-- ========================================================================
-- RLS 보안 클리닝 (Phase 2: Subscriptions & Funeral Companies)
-- ========================================================================
-- [목표] 
-- 1. 구독 정보 및 업체 게시판의 과도한 '공개/Always True' 권한 제거
-- 2. 관리자 및 소유자 기반의 명확한 쓰기 권한 설정
-- 3. 필요한 경우에만 공개 읽기(SELECT) 허용
-- ========================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- 1. facility_subscriptions 테이블 정리
-- ------------------------------------------------------------------------

-- 기존 정책 백업
INSERT INTO public._policy_backup
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'facility_subscriptions';

-- 불필요하거나 과도한 정책 제거
DROP POLICY IF EXISTS "Allow Auth Access" ON public.facility_subscriptions;
DROP POLICY IF EXISTS "Allow Public Read" ON public.facility_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.facility_subscriptions;
DROP POLICY IF EXISTS "manage_own_subscriptions_or_admin" ON public.facility_subscriptions;

-- 강화된 통합 정책 (관리자 또는 시설 소유자 전용)
CREATE POLICY "manage_own_subscriptions_or_admin"
  ON public.facility_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id::text = public.facility_subscriptions.facility_id_uuid::text
        AND f.user_id::text = (auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id::text = public.facility_subscriptions.facility_id_uuid::text
        AND f.user_id::text = (auth.jwt() ->> 'sub')
    )
  );


-- ------------------------------------------------------------------------
-- 2. funeral_companies 테이블 정리
-- ------------------------------------------------------------------------

-- 기존 정책 백업
INSERT INTO public._policy_backup
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'funeral_companies';

-- 과도한 쓰기 권한 및 구버전 정책 제거
DROP POLICY IF EXISTS "Allow authenticated upsert on funeral_companies" ON public.funeral_companies;
DROP POLICY IF EXISTS "Anyone can view funeral companies" ON public.funeral_companies;
DROP POLICY IF EXISTS "admin_only_upsert_funeral_companies" ON public.funeral_companies;

-- 관리자 전용 쓰기 정책 (INSERT/UPDATE/DELETE)
CREATE POLICY "admin_only_upsert_funeral_companies"
  ON public.funeral_companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text IN ('super_admin', 'sangjo_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text IN ('super_admin', 'sangjo_manager')
    )
  );

-- 서비스 노출을 위한 공개 읽기 정책 (SELECT)
CREATE POLICY "funeral_companies_select_public"
  ON public.funeral_companies
  FOR SELECT
  TO public
  USING (true);

COMMIT;

-- 결과 확인
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('facility_subscriptions', 'funeral_companies')
ORDER BY tablename, policyname;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Phase 2: Subscriptions & Funeral Companies 정책 클리닝 완료';
END $$;
