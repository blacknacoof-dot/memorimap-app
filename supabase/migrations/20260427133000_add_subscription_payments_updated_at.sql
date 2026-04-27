-- Ensure subscription payment rows can be updated by refund/cancel flows.
-- Existing payment functions already write updated_at on subscription_payments.
ALTER TABLE public.subscription_payments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.subscription_payments
SET updated_at = COALESCE(paid_at, now())
WHERE updated_at IS NULL;
