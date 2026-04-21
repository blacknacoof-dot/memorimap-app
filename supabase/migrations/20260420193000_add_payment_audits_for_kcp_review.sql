CREATE TABLE IF NOT EXISTS public.payment_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  payment_context TEXT NOT NULL,
  source TEXT NOT NULL,
  order_ref TEXT,
  gateway_provider TEXT NOT NULL DEFAULT 'KCP',
  payment_status TEXT,
  review_status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (review_status IN ('complete', 'incomplete')),
  res_cd TEXT,
  tno TEXT,
  amount INTEGER,
  pay_method TEXT,
  app_no TEXT,
  card_cd TEXT,
  card_no TEXT,
  card_mny INTEGER,
  missing_fields TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(payment_id, source)
);

CREATE INDEX IF NOT EXISTS idx_payment_audits_payment_id
  ON public.payment_audits(payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_audits_review_status
  ON public.payment_audits(review_status, created_at DESC);

ALTER TABLE public.payment_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_audits_service_all" ON public.payment_audits;
CREATE POLICY "payment_audits_service_all"
  ON public.payment_audits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
