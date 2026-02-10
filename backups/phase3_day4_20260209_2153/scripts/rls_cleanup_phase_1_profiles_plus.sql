-- ========================================================================
-- RLS 보안 클리닝 (Phase 1 보강: Profiles 공개 뷰 및 관리자 정책)
-- ========================================================================
-- [목표] 
-- 1. profiles 테이블의 민감 정보(email, phone 등) 노출 차단
-- 2. 공개 조회를 위한 '제한된 뷰(profile_public_view)' 생성
-- 3. super_admin을 위한 profiles 테이블 관리 권한 부여
-- 4. public 권한의 직접적인 profiles 접근 제한
-- ========================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- 1. [백업] 현재 정책 및 상태
-- ------------------------------------------------------------------------
INSERT INTO public._policy_backup
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';

-- ------------------------------------------------------------------------
-- 2. [공개 뷰 생성] 민감 정보가 제외된 뷰
-- ------------------------------------------------------------------------
-- 기존 뷰가 있다면 삭제 후 재생성 (안전하게)
DROP VIEW IF EXISTS public.profile_public_view;

CREATE VIEW public.profile_public_view AS
SELECT 
    id, 
    clerk_id, 
    full_name AS display_name, 
    avatar_url, 
    role,
    created_at
FROM public.profiles;

-- 뷰에 대한 SELECT 권한을 public(누구나)에게 부여
GRANT SELECT ON public.profile_public_view TO public;

-- ------------------------------------------------------------------------
-- 3. [원본 테이블 RLS 보강] super_admin 정책 & public 접근 제어
-- ------------------------------------------------------------------------

-- 기존 Phase 1 정책 일부 조정 (필요시)
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;

-- [A] super_admin을 위한 모든 권한 허용 (profiles 테이블 직접 관리)
DROP POLICY IF EXISTS "profiles_super_admin_all" ON public.profiles;
CREATE POLICY "profiles_super_admin_all"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text = 'super_admin'
    )
  );

-- [B] public 역할의 원본 테이블 직접 SELECT 권한 회수 (뷰를 통해서만 보게 함)
-- 주의: RLS가 켜져 있어도 정책이 없으면 거부되므로, profiles_select_public을 제거한 것만으로도 충분함.

-- ------------------------------------------------------------------------
-- 4. [검증 쿼리 준비] (시뮬레이션 용도)
-- ------------------------------------------------------------------------
-- 이 아래는 실제 적용되지는 않지만, DB에서 실행하여 결과를 확인할 수 있는 예시입니다.
/*
-- anon 권한 체크
SET ROLE anon;
SELECT * FROM public.profile_public_view LIMIT 1; -- 성공해야 함
SELECT * FROM public.profiles LIMIT 1;            -- 실패(0행)해야 함
RESET ROLE;

-- super_admin 권한 체크 (JWT 서브 시뮬레이션 필요)
*/

COMMIT;

-- 최종 상태 출력
SELECT 'VIEW' as type, table_name, null as policy_name, null as roles FROM information_schema.views WHERE table_name = 'profile_public_view'
UNION ALL
SELECT 'POLICY' as type, tablename, policyname, roles FROM pg_policies WHERE tablename = 'profiles';

DO $$ 
BEGIN
    RAISE NOTICE '✅ Phase 1 보강: 공개 뷰 및 관리자 전용 정책 적용 완료';
END $$;
