-- ========================================================================
-- RLS 보안 클리닝 (Phase 3: Facilities & Backups)
-- ========================================================================
-- [목표] 
-- 1. 핵심 테이블인 'facilities'의 과도한 public 쓰기 권한 제거
-- 2. 모든 백업 테이블의 {public}/{anon} 권한을 제거하고 super_admin 전용으로 고정
-- 3. 시스템 및 기타 테이블의 Always True 정책 정리
-- ========================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- 1. [시설] facilities 테이블 정리
-- ------------------------------------------------------------------------
-- 기존 정책 백업
INSERT INTO public._policy_backup
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'facilities';

-- 불필요하거나 과도한 정책 제거
DROP POLICY IF EXISTS "Public facilities are viewable by everyone" ON public.facilities;
DROP POLICY IF EXISTS "Enable read for all" ON public.facilities;
DROP POLICY IF EXISTS "Owners can update own facilities" ON public.facilities;
DROP POLICY IF EXISTS "super_admin_manage_facilities" ON public.facilities;

-- [A] 공개 읽기 정책 (SELECT) - 누구나 가능
CREATE POLICY "facilities_select_public"
  ON public.facilities
  FOR SELECT
  TO public
  USING (true);

-- [B] 시설 소유자/관리자 통합 쓰기 정책 (UPDATE/INSERT/DELETE)
CREATE POLICY "facilities_manage_owner_or_admin"
  ON public.facilities
  FOR ALL
  TO authenticated
  USING (
    (user_id::text = (auth.jwt() ->> 'sub'))
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text = 'super_admin'
    )
  )
  WITH CHECK (
    (user_id::text = (auth.jwt() ->> 'sub'))
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text = 'super_admin'
    )
  );


-- ------------------------------------------------------------------------
-- 2. [백업 & 기타] 모든 백업 테이블 super_admin 전용화
-- ------------------------------------------------------------------------
-- 이 루프는 백업 테이블들의 {public} 정책을 제거하고 super_admin 정책만 남깁니다.

DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
          AND (tablename LIKE '%_backup%' OR tablename IN ('funeral_company_legacy_mapping'))
    LOOP
        -- 기존 {public}/{anon} 정책 제거 (이름에 'Always' 또는 'Allow'가 들어가는 패턴 등)
        EXECUTE format('DROP POLICY IF EXISTS "Always True" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow Public Read" ON public.%I', t);
        
        -- super_admin 관리 정책 확립 (만약 v2.0에서 이미 생성했다면 중복 방지)
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'super_admin_manage_' || t, t);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.profiles p 
              WHERE (p.clerk_id::text = (auth.jwt() ->> ''sub'') OR p.id::text = (auth.jwt() ->> ''sub''))
                AND p.role::text = ''super_admin''
            )
        )', 'super_admin_manage_' || t, t);
        
        RAISE NOTICE '백업 테이블 보안 강화 완료: %', t;
    END LOOP;
END $$;


-- ------------------------------------------------------------------------
-- 3. [기타] consultations, reservations Always True 정리
-- ------------------------------------------------------------------------
-- consultations
DROP POLICY IF EXISTS "Always True" ON public.consultations;
DROP POLICY IF EXISTS "Allow Public Read" ON public.consultations;

-- reservations
DROP POLICY IF EXISTS "Always True" ON public.reservations;
DROP POLICY IF EXISTS "Allow Public Read" ON public.reservations;


COMMIT;

-- 결과 확인
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('facilities', 'consultations', 'reservations')
   OR tablename LIKE '%_backup%'
ORDER BY tablename, policyname;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Phase 3: Facilities & Backups 정책 클리닝 완료';
END $$;
