-- ============================================================
-- 상조 비교/상담 무료 횟수 확대
-- FREE: 1 → 10, BASIC: 5 → 15, PREMIUM: -1 (유지)
-- 2026-03-10
-- ============================================================

-- PERSONAL_FREE: sangjo_compare 1 → 10
UPDATE subscription_plans
SET features = jsonb_set(features, '{sangjo_compare}', '10'::jsonb)
WHERE name_en = 'PERSONAL_FREE';

-- PERSONAL_BASIC: sangjo_compare 5 → 15
UPDATE subscription_plans
SET features = jsonb_set(features, '{sangjo_compare}', '15'::jsonb)
WHERE name_en = 'PERSONAL_BASIC';

-- PERSONAL_PREMIUM: 무제한 유지 (변경 없음)
-- features.sangjo_compare = -1
