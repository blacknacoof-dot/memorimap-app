-- 시설 요금제 4개 등록 (subscription_plans 테이블)
-- updateFacilitySubscription()이 name_en으로 조회하므로 레코드 필수
INSERT INTO subscription_plans (name, name_en, price, sms_quota, ai_chat_quota, features)
VALUES
  ('무료체험', 'FREE', 0, 0, 0,
   '{"photos":3,"ai_chat":false,"sms":false,"stats":false,"badge":null,"priority":"normal"}'::jsonb),
  ('베이직', 'BASIC', 99000, 100, 100,
   '{"photos":-1,"ai_chat":true,"sms":true,"stats":"basic","badge":null,"priority":"normal"}'::jsonb),
  ('프리미엄', 'PREMIUM', 299000, -1, -1,
   '{"photos":-1,"ai_chat":true,"sms":true,"stats":"full","badge":"silver","priority":"high"}'::jsonb),
  ('엔터프라이즈', 'ENTERPRISE', 499000, -1, -1,
   '{"photos":-1,"ai_chat":true,"sms":true,"stats":"full","badge":"gold","priority":"top","api":true,"dedicated_manager":true}'::jsonb)
ON CONFLICT (name_en) DO NOTHING;

-- 상조 요금제 3개 등록
INSERT INTO subscription_plans (name, name_en, price, sms_quota, ai_chat_quota, features)
VALUES
  ('상조 STARTER', 'SJ_STARTER', 3000000, 0, -1,
   '{"ai_consult":true,"auto_closing":true,"coupon":"300000","report":"basic","priority":"normal"}'::jsonb),
  ('상조 PROFESSIONAL', 'SJ_PROFESSIONAL', 8000000, 0, -1,
   '{"ai_consult":true,"crm":"advanced","dashboard":"realtime","cs":"dedicated","report":"weekly","priority":"high"}'::jsonb),
  ('상조 ENTERPRISE', 'SJ_ENTERPRISE', 15000000, 0, -1,
   '{"ai_consult":true,"banner":"exclusive","auto_contract":true,"manager":"dedicated","custom_branding":true,"api":true,"report":"custom","priority":"top"}'::jsonb)
ON CONFLICT (name_en) DO NOTHING;
