-- payment_intents: paymentId -> internal subscription metadata mapping
-- Used to recover subscription payments when verify-payment callback is missed.

CREATE TABLE IF NOT EXISTS public.payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL UNIQUE,
    payment_context TEXT NOT NULL
        CHECK (payment_context IN ('facility_subscription', 'personal_subscription')),
    user_id TEXT NOT NULL,
    facility_id TEXT,
    plan_id TEXT NOT NULL,
    expected_amount INTEGER NOT NULL CHECK (expected_amount >= 0),
    order_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
    portone_status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id
    ON public.payment_intents(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_intents_pending
    ON public.payment_intents(status)
    WHERE status = 'pending';

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_intents_service_all" ON public.payment_intents;
CREATE POLICY "payment_intents_service_all"
    ON public.payment_intents
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
