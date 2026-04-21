ALTER TABLE public.payment_intents
  DROP CONSTRAINT IF EXISTS payment_intents_status_check;

ALTER TABLE public.payment_intents
  ADD CONSTRAINT payment_intents_status_check
  CHECK (status IN ('pending', 'sync_required', 'paid', 'failed', 'cancelled'));
