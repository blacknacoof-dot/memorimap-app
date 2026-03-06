-- ============================================================
-- Security Linter 경고 수정
-- 1. approve/reject_partner_transaction: search_path 고정
-- 2. leads INSERT 정책: WITH CHECK 강화
-- ============================================================

-- 1. Function Search Path 고정 (search_path hijacking 방지)
ALTER FUNCTION public.approve_partner_transaction(BIGINT, TEXT)
  SET search_path = 'public';

ALTER FUNCTION public.reject_partner_transaction(BIGINT, TEXT, TEXT)
  SET search_path = 'public';

-- 2. leads INSERT 정책 강화
--    기존: WITH CHECK (true) → 인증 사용자 누구나 임의 user_id로 삽입 가능
--    수정: 본인 user_id 또는 익명(AI 챗봇 미로그인 사용자) 허용
DROP POLICY IF EXISTS "leads_insert" ON public.leads;

CREATE POLICY "leads_insert"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.clerk_user_id() = user_id   -- 본인 소유 lead (TEXT 타입 일치)
    OR user_id IS NULL                 -- 미로그인 AI 챗봇 캡처
  );

-- NOTE: sangjo_contracts INSERT WITH CHECK (true) — user_id 컬럼 없음, 의도적 설계
-- NOTE: postgis extension in public — Supabase 플랫폼 한계, 수정 불가
-- NOTE: auth_leaked_password_protection — Dashboard > Auth > Security 에서 활성화 필요
