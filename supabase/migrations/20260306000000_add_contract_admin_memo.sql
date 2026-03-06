-- ============================================================
-- sangjo_contracts 테이블에 슈퍼관리자 메모 컬럼 추가
-- 목적: 슈퍼관리자 전용 관제 메모 — 파트너/고객에게 노출되지 않음
-- ============================================================

ALTER TABLE public.sangjo_contracts
  ADD COLUMN IF NOT EXISTS admin_memo TEXT;

COMMENT ON COLUMN public.sangjo_contracts.admin_memo
  IS '슈퍼관리자 관제 메모 — 파트너/고객에게 노출되지 않음';
