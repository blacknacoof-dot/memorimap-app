-- Step 1: 테이블 구조 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscription_plans';

-- Step 2: 현재 데이터 확인
SELECT * FROM subscription_plans;

-- Step 3: 데이터가 없으면 삽입 (id 컬럼이 없을 수 있으니 최소한의 필수 컬럼만 사용)
-- 아래 INSERT 문은 테이블에 데이터가 없을 때만 실행하세요.

INSERT INTO subscription_plans (name, price, sms_quota, ai_chat_quota, features)
SELECT '무료', 0, 0, 0, '{"map_listing": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = '무료');

INSERT INTO subscription_plans (name, price, sms_quota, ai_chat_quota, features)
SELECT '베이직', 99000, 100, 100, '{"map_listing": true, "ai_chat": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = '베이직');

INSERT INTO subscription_plans (name, price, sms_quota, ai_chat_quota, features)
SELECT '프리미엄', 299000, NULL, NULL, '{"map_listing": true, "ai_chat": true, "premium_badge": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = '프리미엄');

INSERT INTO subscription_plans (name, price, sms_quota, ai_chat_quota, features)
SELECT '엔터프라이즈', 499000, NULL, NULL, '{"map_listing": true, "ai_chat": true, "premium_badge": true, "custom_page": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = '엔터프라이즈');

-- Step 4: 삽입 후 확인
SELECT * FROM subscription_plans;
