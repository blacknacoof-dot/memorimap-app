-- ============================================
-- 개인 사용자 구독 테이블 (user_subscriptions)
-- 실행: Supabase SQL Editor에서 실행
-- ============================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Clerk user ID (user_xxxxx 형식)

  -- 플랜 정보
  plan_id TEXT NOT NULL DEFAULT 'personal_free'
    CHECK (plan_id IN ('personal_free', 'personal_basic', 'personal_premium')),
  plan_name TEXT NOT NULL DEFAULT 'PERSONAL_FREE'
    CHECK (plan_name IN ('PERSONAL_FREE', 'PERSONAL_BASIC', 'PERSONAL_PREMIUM')),

  -- 상태
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),

  -- 기간
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,

  -- 사용량 추적 (월간 리셋)
  ai_consult_used INTEGER DEFAULT 0 CHECK (ai_consult_used >= 0),
  sangjo_compare_used INTEGER DEFAULT 0 CHECK (sangjo_compare_used >= 0),
  favorites_count INTEGER DEFAULT 0 CHECK (favorites_count >= 0),
  last_reset_at TIMESTAMP DEFAULT NOW(),

  -- 결제
  billing_cycle VARCHAR(20) DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly')),
  next_billing_date TIMESTAMP,
  last_payment_id TEXT,
  last_payment_amount INTEGER DEFAULT 0,

  -- 취소
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,

  -- 가족 공유 (프리미엄 전용)
  shared_with JSONB DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan_id);

-- 3. updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 월간 사용량 리셋 함수
CREATE OR REPLACE FUNCTION reset_user_subscription_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET
    ai_consult_used = 0,
    sangjo_compare_used = 0,
    last_reset_at = NOW(),
    updated_at = NOW()
  WHERE status = 'active'
    AND last_reset_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 플랜별 한도 조회 함수
CREATE OR REPLACE FUNCTION get_user_plan_limits(p_user_id TEXT)
RETURNS TABLE (
  plan_id TEXT,
  ai_consult_limit INTEGER,
  sangjo_compare_limit INTEGER,
  favorites_limit INTEGER,
  ai_consult_used INTEGER,
  sangjo_compare_used INTEGER,
  favorites_count INTEGER,
  has_ad_free BOOLEAN,
  has_family_share BOOLEAN,
  discount_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.plan_id,
    CASE us.plan_id
      WHEN 'personal_free' THEN 1
      WHEN 'personal_basic' THEN 3
      WHEN 'personal_premium' THEN -1  -- -1 = 무제한
    END AS ai_consult_limit,
    CASE us.plan_id
      WHEN 'personal_free' THEN 1
      WHEN 'personal_basic' THEN 5
      WHEN 'personal_premium' THEN -1
    END AS sangjo_compare_limit,
    CASE us.plan_id
      WHEN 'personal_free' THEN 5
      WHEN 'personal_basic' THEN 20
      WHEN 'personal_premium' THEN -1
    END AS favorites_limit,
    us.ai_consult_used,
    us.sangjo_compare_used,
    us.favorites_count,
    CASE WHEN us.plan_id IN ('personal_basic', 'personal_premium') THEN true ELSE false END AS has_ad_free,
    CASE WHEN us.plan_id = 'personal_premium' THEN true ELSE false END AS has_family_share,
    CASE us.plan_id
      WHEN 'personal_free' THEN 0
      WHEN 'personal_basic' THEN 0.03
      WHEN 'personal_premium' THEN 0.05
    END AS discount_rate
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id AND us.status = 'active';

  -- 구독 레코드 없으면 무료 기본값 반환
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      'personal_free'::TEXT,
      1, 1, 5, 0, 0, 0,
      false, false, 0::NUMERIC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS 설정
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 본인 조회
CREATE POLICY "user_sub_select_own" ON user_subscriptions
  FOR SELECT USING (public.clerk_user_id() = user_id);

-- 본인 INSERT (최초 구독 생성)
CREATE POLICY "user_sub_insert_own" ON user_subscriptions
  FOR INSERT WITH CHECK (public.clerk_user_id() = user_id);

-- 본인 UPDATE (플랜 변경/취소)
CREATE POLICY "user_sub_update_own" ON user_subscriptions
  FOR UPDATE USING (public.clerk_user_id() = user_id);

-- 슈퍼관리자 전체 관리
CREATE POLICY "user_sub_super_admin_all" ON user_subscriptions
  FOR ALL USING (is_super_admin());

-- ============================================
-- 완료! Supabase SQL Editor에서 실행하세요.
-- ============================================
