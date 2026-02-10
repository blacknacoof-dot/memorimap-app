-- subscription_plans 테이블 스키마 수정 및 데이터 초기화

-- 1. name_en 컬럼이 없으면 추가
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'name_en') THEN
        ALTER TABLE subscription_plans ADD COLUMN name_en VARCHAR(50);
        RAISE NOTICE 'Added name_en column to subscription_plans';
    END IF;
END $$;

-- 2. unique constraint 추가 (없으면)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_subscription_plans_name_en') THEN
        ALTER TABLE subscription_plans ADD CONSTRAINT unique_subscription_plans_name_en UNIQUE (name_en);
    END IF;
END $$;

-- 3. 기존 데이터가 있다면 name_en 업데이트 (매핑)
UPDATE subscription_plans SET name_en = 'free' WHERE name = '무료' OR name = 'Free' AND name_en IS NULL;
UPDATE subscription_plans SET name_en = 'basic' WHERE name = '베이직' OR name = 'Basic' AND name_en IS NULL;
UPDATE subscription_plans SET name_en = 'premium' WHERE name = '프리미엄' OR name = 'Premium' AND name_en IS NULL;
UPDATE subscription_plans SET name_en = 'enterprise' WHERE name = '엔터프라이즈' OR name = 'Enterprise' AND name_en IS NULL;

-- 4. 기본 플랜 데이터 삽입 (UPSERT)
INSERT INTO subscription_plans (name, name_en, price, sms_quota, ai_chat_quota, features) VALUES
('무료', 'free', 0, 0, 0, '{"map_listing": true, "photo_limit": 3, "review_view": true}'),
('베이직', 'basic', 99000, 100, 100, '{"map_listing": true, "ai_chat": true, "photo_limit": null}'),
('프리미엄', 'premium', 299000, NULL, NULL, '{"map_listing": true, "ai_chat": true, "premium_badge": true, "top_listing": true}'),
('엔터프라이즈', 'enterprise', 499000, NULL, NULL, '{"map_listing": true, "ai_chat": true, "premium_badge": true, "top_listing": true, "custom_page": true}')
ON CONFLICT (name_en) 
DO UPDATE SET 
    price = EXCLUDED.price,
    sms_quota = EXCLUDED.sms_quota,
    ai_chat_quota = EXCLUDED.ai_chat_quota,
    features = EXCLUDED.features;

-- 확인
SELECT * FROM subscription_plans;
