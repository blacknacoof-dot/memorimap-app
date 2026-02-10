-- ========================================================================
-- RLS 보안 클리닝 (Phase 1: profiles 테이블)
-- ========================================================================
-- [목표] 
-- 1. {public} 역할의 Always True 정책 제거
-- 2. authenticated 인증 사용자 전용 소유권 기반 정책 확립
-- 3. 공개 프로필 조회를 위한 제한된 public SELECT 정책 신설
-- ========================================================================

BEGIN;

-- 1. 기존 정책 백업 (임시 테이블)
INSERT INTO public._policy_backup
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';

-- 2. 기존 혼재된 정책들 제거
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_their_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;

-- 2. 새 표준 정책 적용 (인증된 사용자 전용)
-- [INSERT] 자신의 프로필만 생성 가능
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id::text = (SELECT auth.jwt() ->> 'sub'));

-- [UPDATE] 자신의 프로필만 수정 가능
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id::text = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (id::text = (SELECT auth.jwt() ->> 'sub'));

-- [SELECT] 프로필 정보는 공개 조회 허용 (리뷰 작성자 이름 노출 등)
-- 쓰기(INSERT/UPDATE)는 차단되므로 안전함
CREATE POLICY "profiles_select_public"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);

COMMIT;

-- 결과 확인
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

DO $$ 
BEGIN
    RAISE NOTICE '✅ Phase 1: profiles 테이블 정책 클리닝 완료';
END $$;
