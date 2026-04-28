-- Remove customer SMS from the paid-plan product surface.
-- Customer updates should be handled through in-app notifications and My Page.

UPDATE public.subscription_plans
SET
  sms_quota = 0,
  ai_chat_quota = 0,
  features = jsonb_build_object(
    'photos', 3,
    'ai_chat', false,
    'stats', false,
    'badge', null,
    'priority', 'normal',
    'customer_updates', 'my_page'
  )
WHERE name_en = 'FREE';

UPDATE public.subscription_plans
SET
  price = 49000,
  sms_quota = 0,
  ai_chat_quota = 100,
  features = jsonb_build_object(
    'photos', 20,
    'ai_chat', true,
    'stats', 'basic',
    'badge', null,
    'priority', 'normal',
    'customer_updates', 'my_page'
  )
WHERE name_en = 'BASIC';

UPDATE public.subscription_plans
SET
  price = 199000,
  sms_quota = 0,
  ai_chat_quota = -1,
  features = jsonb_build_object(
    'photos', -1,
    'ai_chat', true,
    'stats', 'full',
    'badge', 'silver',
    'priority', 'high',
    'customer_updates', 'my_page'
  )
WHERE name_en = 'PREMIUM';

UPDATE public.subscription_plans
SET
  sms_quota = 0,
  ai_chat_quota = -1,
  features = jsonb_build_object(
    'photos', -1,
    'ai_chat', true,
    'stats', 'full',
    'badge', 'gold',
    'priority', 'top',
    'api', true,
    'dedicated_manager', true,
    'customer_updates', 'my_page'
  )
WHERE name_en = 'ENTERPRISE';

UPDATE public.subscription_plans
SET
  sms_quota = 0,
  ai_chat_quota = -1,
  features = (COALESCE(features, '{}'::jsonb) - 'sms') || jsonb_build_object(
    'lead_delivery', true,
    'customer_updates', 'my_page',
    'priority', 'high'
  )
WHERE name_en = 'SJ_STARTER';

UPDATE public.subscription_plans
SET
  sms_quota = 0,
  ai_chat_quota = -1,
  features = (COALESCE(features, '{}'::jsonb) - 'sms') || jsonb_build_object(
    'lead_delivery', true,
    'customer_updates', 'my_page'
  )
WHERE name_en IN ('SJ_PROFESSIONAL', 'SJ_ENTERPRISE');
