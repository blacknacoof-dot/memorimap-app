-- [Leads] RLS 정책 수정 (보안 강화)

-- 1. 기존의 충돌/과도한 권한 정책 삭제
DROP POLICY IF EXISTS "Admins view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users view own leads" ON public.leads;
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.leads;
DROP POLICY IF EXISTS "Admins view all" ON public.leads;

-- 2. 새 정책 적용 (Option C 기반)

-- (1) 누구나(비회원 포함) 리드 생성 가능 (INSERT)
CREATE POLICY "Public insert leads" ON public.leads
  FOR INSERT 
  WITH CHECK (true);

-- (2) 본인의 리드만 조회 가능 (SELECT, Auth UID 매칭)
-- user_id가 TEXT 타입이므로 형변환 주의
CREATE POLICY "Users view own leads" ON public.leads
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid()::text);

-- (3) 관리자(Admin/Super Admin)는 모든 리드 조회 가능 (SELECT)
-- profiles 테이블의 role 확인 (Enum 값: super_admin, sangjo_manager, facility_manager)
-- 'admin'은 Enum에 없으므로 super_admin과 sangjo_manager를 관리자로 간주
CREATE POLICY "Admins view all leads" ON public.leads
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id = (auth.jwt() ->> 'sub'::text))
        AND p.role IN ('super_admin', 'sangjo_manager')
    )
  );

-- [참고] Consultations 테이블 정책은 이미 적절하므로 유지하거나 필요시 보강
-- (여기서는 Leads 테이블 수정에 집중)
