-- Recurring subscription rollout support.
-- Additive only so one-time subscription checkout can remain as the rollback path.

ALTER TABLE public.payment_intents
  ADD COLUMN IF NOT EXISTS billing_key TEXT;

ALTER TABLE public.facility_subscriptions
  ADD COLUMN IF NOT EXISTS billing_key TEXT,
  ADD COLUMN IF NOT EXISTS billing_key_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_error TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS billing_key TEXT,
  ADD COLUMN IF NOT EXISTS billing_key_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_error TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_facility_subscriptions_recurring_due
  ON public.facility_subscriptions (next_billing_date)
  WHERE status = 'active' AND auto_renew = true AND billing_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_recurring_due
  ON public.user_subscriptions (expires_at)
  WHERE status = 'active' AND auto_renew = true AND billing_key IS NOT NULL;
