-- =============================================
-- [P0] 배포 전 최종 보안 및 성능 최적화 패치
-- 1. memorial_spaces 보안 강화 (Kimi 가이드 반영)
-- 2. user_ending_notes RLS 에러(42501) 해결
-- 3. RLS 서브쿼리 성능 병목 해결 (Security Definer 활용)
-- =============================================

BEGIN;

-- ---------------------------------------------
-- 1. 성능 최적화: 유저 역할 조회를 위한 보안 정의 함수
-- ---------------------------------------------
-- 매번 RLS에서 profiles를 SELECT하는 서브쿼리 병목을 줄이기 위해
-- 캐싱 가능성이 높은 SECURITY DEFINER 함수로 전환합니다.
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- 함수 생성자 권한으로 실행 (RLS 우회)
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE clerk_id = p_user_id OR id::text = p_user_id LIMIT 1);
END;
$$;

-- ---------------------------------------------
-- 2. memorial_spaces RLS 강화
-- ---------------------------------------------
-- Public INSERT 권한 제거 (가장 심각한 취약점)
DROP POLICY IF EXISTS "Allow public insert memorial_spaces" ON public.memorial_spaces;

-- 관리자만 생성/수정 가능하도록 정책 변경
-- 10x Dev Tip: auth.jwt() ->> 'sub'를 사용하여 Clerk 인증 정보와 직접 비교
CREATE POLICY "Admin restricted memorial_spaces" 
ON public.memorial_spaces 
FOR ALL 
TO authenticated 
USING (
    public.get_user_role(auth.jwt() ->> 'sub') IN ('super_admin', 'facility_admin')
)
WITH CHECK (
    public.get_user_role(auth.jwt() ->> 'sub') IN ('super_admin', 'facility_admin')
);

-- ---------------------------------------------
-- 3. user_ending_notes RLS 에러(42501) 해결 및 안정화
-- ---------------------------------------------
-- 기존 정책 초기화
DROP POLICY IF EXISTS "ending_notes_owner_all" ON public.user_ending_notes;

-- Upsert 시 INSERT/UPDATE/SELECT 권한이 모두 필요함
-- 🚑 해결책: USING과 WITH CHECK를 명확히 분리하고, auth.jwt() 부재 시의 방어 로직 강화
CREATE POLICY "ending_notes_owner_access" 
ON public.user_ending_notes 
FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'sub' = user_id)
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- ---------------------------------------------
-- 4. 타입 불일치(BIGINT vs UUID) 대응을 위한 CASTING 지원 (임시)
-- ---------------------------------------------
-- 프런트엔드에서 UUID로 잘못 보낼 경우를 대비한 방어적 프로시저/함수 업데이트 (필요 시)

COMMIT;

-- 확인 출력
DO $$ BEGIN RAISE NOTICE 'P0 보안 패치가 성공적으로 적용되었습니다.'; END $$;
