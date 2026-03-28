-- 레거시 소문자 subscription_plans 행 정리 (2026-03-28)
-- 배경: 2025-12-19 생성된 초기 시설 플랜 4건 (free/basic/premium/enterprise)이
--       대문자 canonical 행 (FREE/BASIC/PREMIUM/ENTERPRISE)과 공존하여 혼선 유발
-- 사전 작업: PLAN_ID_ALIASES 반환값을 대문자로 통일 (c95f3a6)

-- Step 1: facility_subscriptions plan_id 정규화 (소문자 → 대문자, 멱등)
UPDATE facility_subscriptions
SET plan_id = UPPER(plan_id)
WHERE plan_id IN ('free', 'basic', 'premium', 'enterprise');

-- Step 2: 레거시 소문자 행 삭제
DELETE FROM subscription_plans
WHERE name_en IN ('free', 'basic', 'premium', 'enterprise');
