-- ============================================================
-- sangjo_contracts INSERT RLS 수정
-- ============================================================
-- 문제: INSERT 정책이 sangjo_hq_admins만 허용
--       → 일반 사용자가 상조 상담 신청 시 403 Forbidden
-- 수정: INSERT는 모든 인증 사용자 허용 (상담 신청은 사용자 행위)
--       SELECT/UPDATE는 기존 관리자 정책 유지
-- ============================================================

-- 기존 INSERT 정책 제거
DROP POLICY IF EXISTS "sangjo_contracts_insert_own" ON public.sangjo_contracts;
DROP POLICY IF EXISTS "sangjo_contracts_insert" ON public.sangjo_contracts;
DROP POLICY IF EXISTS "sangjo_contracts_insert_auth" ON public.sangjo_contracts;

-- 새 INSERT 정책: 인증된 사용자면 누구나 상담 신청 가능
CREATE POLICY "sangjo_contracts_insert_authenticated"
  ON public.sangjo_contracts FOR INSERT TO authenticated
  WITH CHECK (true);
