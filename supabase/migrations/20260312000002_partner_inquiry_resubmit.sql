-- 거절/취소된 파트너 신청은 같은 이메일로 재신청 허용
-- 기존: UNIQUE (company_email) — 무조건 1건만
-- 변경: UNIQUE (company_email) WHERE status NOT IN ('rejected', 'cancelled')

-- 1. 기존 무조건 UNIQUE 인덱스 제거
DROP INDEX IF EXISTS public.partner_inquiries_company_email_idx;

-- 2. 조건부 UNIQUE 인덱스 생성 (진행중/승인된 신청만 중복 차단)
CREATE UNIQUE INDEX partner_inquiries_company_email_active_idx
  ON public.partner_inquiries (company_email)
  WHERE status NOT IN ('rejected', 'cancelled');
