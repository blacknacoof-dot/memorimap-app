-- [20260203] Leads 테이블 RLS 정책 정리
-- 중복된 정책들을 삭제하여 보안 린트 경고를 해결하고 관리를 단순화합니다.

-- 1. 기존 중복 정책 삭제
DROP POLICY IF EXISTS "Allow public insert" ON public.leads;
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
DROP POLICY IF EXISTS "Allow ChatBot to insert leads" ON public.leads;

-- 2. 단일 통합 정책 생성 (익명 및 인증 사용자 모두 허용)
-- AI 상담 시 비로그인 사용자도 리드를 생성할 수 있어야 하므로 FOR INSERT TO public을 유지합니다.
CREATE POLICY "Enable insert for all users"
ON public.leads
FOR INSERT
TO public
WITH CHECK (true);

-- 3. 조회 권한은 기존 정책 유지 (이미 foundation 마이그레이션에 정의됨)
-- - "Super Admins can manage all leads" (ALL)
-- - "Facility Admins can view own leads" (SELECT)
-- - "Users can view own leads" (SELECT)
