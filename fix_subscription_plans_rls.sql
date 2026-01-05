-- subscription_plans 테이블 완전 접근 권한 수정
-- 문제: RLS 정책만으로는 부족, anon/authenticated 역할에 GRANT 필요

-- 1. anon과 authenticated 역할에 SELECT 권한 부여
GRANT SELECT ON subscription_plans TO anon;
GRANT SELECT ON subscription_plans TO authenticated;

-- 2. RLS가 활성화되어 있다면, 정책도 확인
-- (이미 실행했으면 스킵해도 됨)
DROP POLICY IF EXISTS "Anyone can read subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can read subscription plans"
ON subscription_plans
FOR SELECT
USING (true);

-- 3. 혹시 RLS가 비활성화되어 있으면 활성화
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 4. 테스트
SELECT id, name, name_en, price FROM subscription_plans;
