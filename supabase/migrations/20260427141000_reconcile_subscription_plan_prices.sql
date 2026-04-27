-- Reconcile live subscription plan prices with the pricing v1 product surface.
-- Payment Edge Functions read subscription_plans.price as the actual charge amount.

UPDATE public.subscription_plans
SET price = 199000,
    display_plan_name = '프리미엄',
    billing_cycle = 'monthly',
    discount_amount = COALESCE(discount_amount, 0),
    discount_reason = discount_reason,
    is_active = true
WHERE name_en = 'PREMIUM';

UPDATE public.subscription_plans
SET price = 1500000,
    display_plan_name = '파일럿',
    billing_cycle = 'monthly',
    discount_amount = 1500000,
    discount_reason = '출시 파일럿 (3개월 한정)',
    is_active = true
WHERE name_en = 'SJ_STARTER';
