-- 1. Link facility_subscriptions to memorial_spaces
ALTER TABLE public.facility_subscriptions
DROP CONSTRAINT IF EXISTS facility_subscriptions_facility_id_fkey;

ALTER TABLE public.facility_subscriptions
ADD CONSTRAINT facility_subscriptions_facility_id_fkey
FOREIGN KEY (facility_id) 
REFERENCES public.memorial_spaces(id);

-- 2. Link leads to memorial_spaces
ALTER TABLE public.leads
DROP CONSTRAINT IF EXISTS leads_facility_id_fkey;

ALTER TABLE public.leads
ADD CONSTRAINT leads_facility_id_fkey
FOREIGN KEY (facility_id) 
REFERENCES public.memorial_spaces(id);

-- 3. Link subscription_payments to memorial_spaces (via facility_id)
ALTER TABLE public.subscription_payments
DROP CONSTRAINT IF EXISTS subscription_payments_facility_id_fkey;

ALTER TABLE public.subscription_payments
ADD CONSTRAINT subscription_payments_facility_id_fkey
FOREIGN KEY (facility_id) 
REFERENCES public.memorial_spaces(id);
