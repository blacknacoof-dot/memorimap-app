-- ai_consultations RLS 정책 보완 (v2.2)
-- 2026-02-01 로그인 사용자 전용 및 보안 강화

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can start a consultation" ON public.ai_consultations;
DROP POLICY IF EXISTS "Anyone can view consultations" ON public.ai_consultations;
DROP POLICY IF EXISTS "Anyone can update own consultations" ON public.ai_consultations;
DROP POLICY IF EXISTS "Users can view own consultations" ON public.ai_consultations;
DROP POLICY IF EXISTS "Users can insert own consultations" ON public.ai_consultations;
DROP POLICY IF EXISTS "Users can update own consultations" ON public.ai_consultations;
DROP POLICY IF EXISTS "Admins can view all consultations" ON public.ai_consultations;

-- 2. 신규 정책 수립 (로그인 사용자 전용)

-- A. [INSERT] 인증된 사용자만 상담 시작 가능
CREATE POLICY "Authenticated users can start a consultation"
  ON public.ai_consultations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- B. [SELECT] 본인 상담 내역만 조회 가능
CREATE POLICY "Users can view own consultations"
  ON public.ai_consultations FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- C. [UPDATE] 본인 상담 내역만 업데이트 가능
CREATE POLICY "Users can update own consultations"
  ON public.ai_consultations FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- D. [Admin] 슈퍼 관리자 전용 권한 (모든 상담 조회 허용)
CREATE POLICY "Admins can view all consultations"
  ON public.ai_consultations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 3. 실시간 감시를 위한 권한 확인
ALTER TABLE public.ai_consultations REPLICA IDENTITY FULL;
