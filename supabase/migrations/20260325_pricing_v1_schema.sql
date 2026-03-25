-- ============================================================
-- Pricing V1: 요금제 스키마 변경 + 데이터 업데이트
-- 2026-03-25
-- ============================================================
-- 변경 요약:
--   1. subscription_plans에 billing_cycle, display_plan_name, discount_amount, discount_reason, is_active 추가
--   2. v1 확정 가격으로 UPDATE (legacy row는 is_active=false)
--   3. subscription_payments에 user_id, payment_context 추가 (personal 결제이력 공용)
--   4. backfill: 기존 행 payment_context = 'facility' 설정
-- ============================================================

-- ========================================
-- 1. subscription_plans 스키마 확장
-- ========================================

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS display_plan_name TEXT;

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS discount_reason TEXT;

ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ========================================
-- 2. subscription_payments 확장 (personal 공용)
-- ========================================

-- user_id: personal 결제 시 사용 (facility는 subscription_id 사용)
ALTER TABLE subscription_payments
  ADD COLUMN IF NOT EXISTS user_id TEXT;

-- payment_context: 어떤 구독 유형의 결제인지 구분
ALTER TABLE subscription_payments
  ADD COLUMN IF NOT EXISTS payment_context TEXT DEFAULT 'facility';

-- portone_payment_id: PortOne 결제 고유 ID (검증/환불 추적)
ALTER TABLE subscription_payments
  ADD COLUMN IF NOT EXISTS portone_payment_id TEXT;

-- CHECK: facility는 subscription_id 필수, personal은 user_id 필수
-- 기존 데이터 호환을 위해 두 컬럼 모두 nullable 허용 (application level에서 검증)

-- ========================================
-- 3. 기존 행 백필 (payment_context)
-- ========================================

UPDATE subscription_payments
SET payment_context = 'facility'
WHERE payment_context IS NULL OR payment_context = '';

-- ========================================
-- 4. subscription_plans 데이터 업데이트
-- ========================================

-- 4-A. 기존 lowercase/legacy row 비활성화 (삭제하지 않음)
UPDATE subscription_plans
SET is_active = false
WHERE name_en IN ('basic', 'BASIC', 'free', 'FREE', 'premium', 'PREMIUM', 'enterprise', 'ENTERPRISE')
  AND name_en = LOWER(name_en);

-- 4-B. Personal 요금제: 3티어 → 2티어 (BASIC 비활성)
UPDATE subscription_plans
SET is_active = false,
    display_plan_name = '베이직 (단종)'
WHERE name_en = 'PERSONAL_BASIC';

-- 4-C. Personal PREMIUM: 9,900 → 4,900
UPDATE subscription_plans
SET price = 4900,
    display_plan_name = '프리미엄',
    billing_cycle = 'monthly'
WHERE name_en = 'PERSONAL_PREMIUM';

-- 4-D. Personal FREE: display_plan_name 설정
UPDATE subscription_plans
SET display_plan_name = '무료',
    billing_cycle = 'monthly'
WHERE name_en = 'PERSONAL_FREE';

-- 4-E. Facility FREE: 유지
UPDATE subscription_plans
SET display_plan_name = '무료체험',
    billing_cycle = 'monthly'
WHERE name_en = 'FREE';

-- 4-F. Facility BASIC → LIGHT: 99,000 → 49,000
UPDATE subscription_plans
SET price = 49000,
    display_plan_name = '라이트',
    billing_cycle = 'monthly'
WHERE name_en = 'BASIC';

-- 4-G. Facility PREMIUM: 299,000 → 199,000
UPDATE subscription_plans
SET price = 199000,
    display_plan_name = '프리미엄',
    billing_cycle = 'monthly'
WHERE name_en = 'PREMIUM';

-- 4-H. Facility ENTERPRISE: 499,000 → 문의형 (가격 0, 비활성)
UPDATE subscription_plans
SET price = 0,
    display_plan_name = '엔터프라이즈',
    is_active = false,
    billing_cycle = 'monthly'
WHERE name_en = 'ENTERPRISE';

-- 4-I. Sangjo SJ_STARTER: 3,000,000 → 1,500,000 (파일럿)
UPDATE subscription_plans
SET price = 1500000,
    display_plan_name = '파일럿',
    billing_cycle = 'monthly',
    discount_amount = 1500000,
    discount_reason = '출시 파일럿 (3개월 한정)'
WHERE name_en = 'SJ_STARTER';

-- 4-J. Sangjo SJ_PROFESSIONAL / SJ_ENTERPRISE: 비활성
UPDATE subscription_plans
SET is_active = false,
    display_plan_name = '프로페셔널 (미출시)'
WHERE name_en = 'SJ_PROFESSIONAL';

UPDATE subscription_plans
SET is_active = false,
    display_plan_name = '엔터프라이즈 (미출시)'
WHERE name_en = 'SJ_ENTERPRISE';

-- ========================================
-- 5. 기존 가입자 백필 (billing_cycle)
-- ========================================

-- facility_subscriptions: 기존 가입자에 billing_cycle 없으면 monthly
-- (facility_subscriptions 테이블에 billing_cycle 컬럼이 없을 수 있으므로 안전하게 추가)
ALTER TABLE facility_subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

UPDATE facility_subscriptions
SET billing_cycle = 'monthly'
WHERE billing_cycle IS NULL;

-- user_subscriptions에도 billing_cycle 추가
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

UPDATE user_subscriptions
SET billing_cycle = 'monthly'
WHERE billing_cycle IS NULL;

-- ========================================
-- 6. subscription_payments RLS 업데이트
--    personal 결제도 본인 조회 가능하도록
-- ========================================

-- 기존 SELECT 정책 교체
DROP POLICY IF EXISTS "subscription_payments_select_restricted" ON subscription_payments;

CREATE POLICY "subscription_payments_select_v2"
  ON subscription_payments FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR (
      -- facility 결제: facility_subscriptions 소유자
      payment_context = 'facility'
      AND EXISTS (
        SELECT 1 FROM facility_subscriptions fs
        WHERE fs.id = subscription_payments.subscription_id
          AND EXISTS (
            SELECT 1 FROM facilities f
            WHERE (f.id = fs.facility_id_uuid OR f.legacy_id = fs.facility_id_bigint)
              AND f.admin_id = public.clerk_user_id()
          )
      )
    )
    OR (
      -- personal 결제: 본인
      payment_context = 'personal'
      AND user_id = public.clerk_user_id()
    )
  );

-- ========================================
-- 7. subscription_payments INSERT 정책 업데이트
--    기존: service_role only → 추가: 본인 personal 결제 insert 허용
-- ========================================

DROP POLICY IF EXISTS "subscription_payments_insert_service_only" ON subscription_payments;

-- service_role: 모든 INSERT (facility 결제 등 서버사이드)
CREATE POLICY "subscription_payments_insert_service"
  ON subscription_payments FOR INSERT
  TO service_role
  WITH CHECK (true);

-- authenticated: 본인 personal 결제만 INSERT
CREATE POLICY "subscription_payments_insert_personal"
  ON subscription_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    payment_context = 'personal'
    AND user_id = public.clerk_user_id()
  );
