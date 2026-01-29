-- ========================================================================
-- RLS 보안 클리닝 (Phase 4: Final Legacy Scrub)
-- ========================================================================
-- [목표] 
-- 1. Phase 1~3에서 미처 제거되지 않은 구버전의 '명명된(Named)' 정책들 일괄 정리
-- 2. 중복된 관리자 정책(Admin only access 등) 제거하여 정책 명단 단순화
-- 3. 표준화된 명칭(super_admin_manage_..., tablename_select_public 등)만 남김
-- ========================================================================

BEGIN;

-- 1. [시설] facilities 테이블 잔여 정책 제거
DROP POLICY IF EXISTS "Allow owners to update their own facilities" ON public.facilities;
DROP POLICY IF EXISTS "Super admins can update all facilities" ON public.facilities;

-- 2. [상담/예약] consultations & reservations 잔여 정책 제거 (표준 정책 수립 전 대대적 정리)
-- consultations
DROP POLICY IF EXISTS "Facility Admins can update facility consultations" ON public.consultations;
DROP POLICY IF EXISTS "Facility Admins can view facility consultations" ON public.consultations;
DROP POLICY IF EXISTS "Facility owners can see consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can create consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can insert own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can see their own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can update own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can view own consultations" ON public.consultations;

-- reservations
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can see their own reservations" ON public.reservations;

-- 3. [백업 테이블] 중복 관리자 정책 제거
-- 이전에 'Admin only access - [테이블명]' 형식으로 생성된 정책들을 모두 제거합니다.

DO $$ 
DECLARE 
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND (
            policyname LIKE 'Admin only access - %'
            OR policyname IN ('Enable insert for owners', 'Enable update for owners', 'Public facilities are viewable by everyone')
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, policy_rec.tablename);
        RAISE NOTICE '구버전 관리 정책 제거됨: % (테이블: %)', policy_rec.policyname, policy_rec.tablename;
    END LOOP;
END $$;

-- 4. [보강] consultations & reservations 표준 정책 수립
-- (기존에 Always True만 지우고 새 정책을 안세웠을 경우를 대비)

-- consultations: 소유자/관리자만 조회/수정 가능 (SELECT/UPDATE/DELETE)
-- INSERT는 authenticated 누구나 가능 (상담 신청이므로)
CREATE POLICY "consultations_insert_authenticated"
  ON public.consultations FOR INSERT TO authenticated WITH CHECK ( (user_id::text = (auth.jwt() ->> 'sub')) );

CREATE POLICY "consultations_manage_own_or_admin"
  ON public.consultations FOR ALL TO authenticated
  USING (
    (user_id::text = (auth.jwt() ->> 'sub'))
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text = 'super_admin'
    )
  );

-- reservations: 소유자/관리자만 조회/수정 가능
CREATE POLICY "reservations_insert_authenticated"
  ON public.reservations FOR INSERT TO authenticated WITH CHECK ( (user_id::text = (auth.jwt() ->> 'sub')) );

CREATE POLICY "reservations_manage_own_or_admin"
  ON public.reservations FOR ALL TO authenticated
  USING (
    (user_id::text = (auth.jwt() ->> 'sub'))
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text = 'super_admin'
    )
  );

COMMIT;

-- 결과 확인
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('facilities', 'consultations', 'reservations')
   OR tablename LIKE '%_backup%'
ORDER BY tablename, policyname;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Phase 4: 최종 레거시 정책 정리 완료';
END $$;
