-- Allow anonymous sangjo consultation requests without opening reads or updates.
--
-- This intentionally only permits INSERT for rows that match the public
-- consultation intake flow. Existing authenticated admin/partner SELECT,
-- UPDATE, and DELETE policies remain unchanged.

ALTER TABLE IF EXISTS public.sangjo_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sangjo_contract_timeline ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.sangjo_contracts TO anon;
GRANT INSERT ON public.sangjo_contract_timeline TO anon;

DROP POLICY IF EXISTS "sangjo_contracts_insert_anon_consultation" ON public.sangjo_contracts;
CREATE POLICY "sangjo_contracts_insert_anon_consultation"
  ON public.sangjo_contracts
  FOR INSERT
  TO anon
  WITH CHECK (
    application_type = 'CONSULTATION'
    AND status = '상담신청'
    AND sangjo_id IS NOT NULL
    AND contract_number IS NOT NULL
    AND length(btrim(contract_number)) >= 4
    AND customer_name IS NOT NULL
    AND length(btrim(customer_name)) >= 2
    AND customer_phone IS NOT NULL
    AND length(btrim(customer_phone)) >= 8
    AND (total_price IS NULL OR total_price = 0)
  );

DROP POLICY IF EXISTS "sangjo_contract_timeline_insert_anon_consultation" ON public.sangjo_contract_timeline;
CREATE POLICY "sangjo_contract_timeline_insert_anon_consultation"
  ON public.sangjo_contract_timeline
  FOR INSERT
  TO anon
  WITH CHECK (
    contract_number IS NOT NULL
    AND length(btrim(contract_number)) >= 4
    AND event IS NOT NULL
    AND event IN ('상담 신청', '상담 요청 접수')
  );
