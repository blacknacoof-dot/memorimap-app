-- ============================================
-- memorimap 구독 시스템 및 시설 운영 스키마 (최종 고도화 버전)
-- ============================================

-- 1. 구독 플랜 테이블
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  name_en VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  sms_quota INTEGER CHECK (sms_quota >= 0),
  ai_chat_quota INTEGER CHECK (ai_chat_quota >= 0),
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_subscription_plans_name_en UNIQUE (name_en)
);

-- 기존 테이블이 있을 경우를 대비한 제약조건 추가
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_subscription_plans_name_en') THEN
    ALTER TABLE subscription_plans ADD CONSTRAINT unique_subscription_plans_name_en UNIQUE (name_en);
  END IF;
END $$;

-- 2. 업체 구독 정보 테이블
CREATE TABLE IF NOT EXISTS facility_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id BIGINT REFERENCES memorial_spaces(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  
  -- 📊 사용량 추적
  sms_used INTEGER DEFAULT 0 CHECK (sms_used >= 0),
  ai_chat_used INTEGER DEFAULT 0 CHECK (ai_chat_used >= 0),
  last_reset_at TIMESTAMP DEFAULT NOW(),
  
  -- 📅 청구 주기
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  next_billing_date TIMESTAMP,
  
  -- 🔔 취소 정보
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(facility_id),
  CONSTRAINT valid_expiry CHECK (expires_at > started_at)
);

-- 3. 업체별 FAQ 테이블
CREATE TABLE IF NOT EXISTS facility_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id BIGINT REFERENCES memorial_spaces(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (
    category IN ('price', 'parking', 'hours', 'process', 'facilities', 'other')
  ),
  question TEXT NOT NULL CHECK (length(question) >= 5),
  answer TEXT NOT NULL CHECK (length(answer) >= 10),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(facility_id, order_index)
);

-- 4. 문자 템플릿 테이블 (로그 테이블 이전에 정의)
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (
    type IN ('reservation_confirmed', 'reminder_d7', 'reminder_d3', 
             'reminder_d1', 'day_of', 'review_request', 'cancellation')
  ),
  subject VARCHAR(200),
  content TEXT NOT NULL CHECK (length(content) > 0),
  variables JSONB DEFAULT '{}',
  max_length INTEGER CHECK (max_length > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_sms_templates_type UNIQUE (type)
);

-- 기존 테이블이 있을 경우를 대비한 제약조건 추가
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_sms_templates_type') THEN
    ALTER TABLE sms_templates ADD CONSTRAINT unique_sms_templates_type UNIQUE (type);
  END IF;
END $$;

-- 5. 문자 발송 로그 테이블
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id BIGINT REFERENCES memorial_spaces(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,
  
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(100),
  
  message_type VARCHAR(20) NOT NULL CHECK (
    message_type IN ('kakao_alimtalk', 'sms', 'lms', 'mms')
  ),
  content TEXT NOT NULL CHECK (length(content) > 0),
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'failed', 'delivered', 'read')
  ),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT,
  error_code VARCHAR(50),
  
  cost INTEGER CHECK (cost >= 0),
  retry_count INTEGER DEFAULT 0,
  parent_log_id UUID REFERENCES sms_logs(id),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. 결제 내역 테이블
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES facility_subscriptions(id) ON DELETE CASCADE,
  
  amount INTEGER NOT NULL CHECK (amount >= 0),
  tax_amount INTEGER DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount INTEGER DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount INTEGER NOT NULL CHECK (final_amount >= 0),
  
  payment_method VARCHAR(50) CHECK (
    payment_method IN ('card', 'bank_transfer', 'virtual_account', 'phone', 'kakao_pay', 'naver_pay')
  ),
  payment_key VARCHAR(200) UNIQUE,
  merchant_uid VARCHAR(200) UNIQUE,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded', 'partial_refund')
  ),
  
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_amount INTEGER CHECK (refund_amount >= 0),
  refund_reason TEXT,
  receipt_url TEXT,
  
  billing_period_start DATE,
  billing_period_end DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. 시설 상세 리뷰 테이블
CREATE TABLE IF NOT EXISTS facility_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id BIGINT REFERENCES memorial_spaces(id) ON DELETE CASCADE,
  
  user_id TEXT, -- Supabase auth.uid()::text
  author_name VARCHAR(100) NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  
  rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  content TEXT CHECK (length(content) >= 10 OR content IS NULL),
  
  photos JSONB DEFAULT '[]',
  photo_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(photos)) STORED,
  
  source VARCHAR(20) DEFAULT 'user' CHECK (
    source IN ('user', 'naver', 'kakao', 'google')
  ),
  external_id VARCHAR(200),
  external_url TEXT,
  
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  
  reply_content TEXT,
  replied_at TIMESTAMP,
  reply_user_id TEXT,
  
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 중복 리뷰 방지 (사용자가 같은 시설에 여러 리뷰 작성 방지)
  UNIQUE NULLS NOT DISTINCT (facility_id, user_id, source)
);

-- 8. 시설 상세 이미지 테이블
CREATE TABLE IF NOT EXISTS facility_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id BIGINT REFERENCES memorial_spaces(id) ON DELETE CASCADE,
  
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type VARCHAR(50),
  
  category VARCHAR(50) DEFAULT 'general' CHECK (
    category IN ('interior', 'exterior', 'view', 'price_list', 'facility', 'parking', 'naver', 'general')
  ),
  
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  source VARCHAR(20) DEFAULT 'upload' CHECK (
    source IN ('upload', 'naver', 'kakao', 'google')
  ),
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(facility_id, category, order_index)
);

-- 9. 리뷰 도움됨 기록 테이블 (중복 방지)
CREATE TABLE IF NOT EXISTS review_helpful_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES facility_reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- 10. 구독 변경 이력 테이블
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES facility_subscriptions(id) ON DELETE CASCADE,
  from_plan_id UUID REFERENCES subscription_plans(id),
  to_plan_id UUID REFERENCES subscription_plans(id),
  change_type VARCHAR(20) CHECK (
    change_type IN ('upgrade', 'downgrade', 'renewal', 'cancellation', 'reactivation')
  ),
  reason TEXT,
  changed_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. FAQ 조회 통계 테이블
CREATE TABLE IF NOT EXISTS faq_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id UUID REFERENCES facility_faqs(id) ON DELETE CASCADE,
  user_id TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_facility_subscriptions_facility ON facility_subscriptions(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_subscriptions_status ON facility_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_facility_faqs_facility ON facility_faqs(facility_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_facility ON sms_logs(facility_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_facility_reviews_facility ON facility_reviews(facility_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_facility_reviews_rating ON facility_reviews(facility_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_facility_reviews_created ON facility_reviews(facility_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_facility_images_facility ON facility_images(facility_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_facility_images_order ON facility_images(facility_id, category, order_index);

-- ============================================
-- 트리거 및 자동화 함수
-- ============================================

-- updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facility_subscriptions_updated_at BEFORE UPDATE ON facility_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facility_faqs_updated_at BEFORE UPDATE ON facility_faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facility_reviews_updated_at BEFORE UPDATE ON facility_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_payments_updated_at BEFORE UPDATE ON subscription_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ⭐ 천재적 평점 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_facility_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE memorial_spaces
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM facility_reviews
      WHERE facility_id = COALESCE(NEW.facility_id, OLD.facility_id) AND is_active = true
    ),
    review_count = (
      SELECT COUNT(*)
      FROM facility_reviews
      WHERE facility_id = COALESCE(NEW.facility_id, OLD.facility_id) AND is_active = true
    )
  WHERE id = COALESCE(NEW.facility_id, OLD.facility_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_facility_rating_on_review ON facility_reviews;
CREATE TRIGGER update_facility_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON facility_reviews
  FOR EACH ROW EXECUTE FUNCTION update_facility_rating();

-- ============================================
-- 초기 데이터 삽입
-- ============================================

INSERT INTO subscription_plans (name, name_en, price, sms_quota, ai_chat_quota, features) VALUES
('무료', 'free', 0, 0, 0, '{"map_listing": true, "photo_limit": 3, "review_view": true}'),
('베이직', 'basic', 99000, 100, 100, '{"map_listing": true, "ai_chat": true, "photo_limit": null}'),
('프리미엄', 'premium', 299000, NULL, NULL, '{"map_listing": true, "ai_chat": true, "premium_badge": true, "top_listing": true}'),
('엔터프라이즈', 'enterprise', 499000, NULL, NULL, '{"map_listing": true, "ai_chat": true, "premium_badge": true, "top_listing": true, "custom_page": true}')
ON CONFLICT (name_en) DO NOTHING;

-- 기본 문자 템플릿
INSERT INTO sms_templates (name, type, subject, content, variables) VALUES
('예약 확정 알림', 'reservation_confirmed', '[{{facilityName}}] 예약 확정', '안녕하세요 {{userName}}님, {{facilityName}} 예약이 확정되었습니다.', '{"facilityName": "시설명", "userName": "사용자명"}')
ON CONFLICT (type) DO NOTHING;

-- ============================================
-- 12. 보안 및 RLS 정책 (Security & RLS)
-- ============================================

-- RLS 활성화
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_view_logs ENABLE ROW LEVEL SECURITY;

-- (1) 누구나 조회 가능한 테이블 (공개 데이터)
CREATE POLICY "Public Read Access" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON facility_images FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON facility_reviews FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON review_helpful_logs FOR SELECT USING (true);

-- (2) 관리자(Super Admin) 전용 권한
-- 슈퍼 관리자는 모든 권한(ALL)을 가짐
CREATE POLICY "Super Admin Manage All" ON subscription_plans FOR ALL USING (is_super_admin());
CREATE POLICY "Super Admin Manage All" ON sms_templates FOR ALL USING (is_super_admin());
CREATE POLICY "Super Admin Manage All" ON subscription_payments FOR ALL USING (is_super_admin());
CREATE POLICY "Super Admin Manage All" ON facility_reviews FOR ALL USING (is_super_admin());
CREATE POLICY "Super Admin Manage All" ON facility_images FOR ALL USING (is_super_admin());
CREATE POLICY "Super Admin Manage All" ON review_helpful_logs FOR ALL USING (is_super_admin());
CREATE POLICY "Super Admin Manage All" ON subscription_history FOR ALL USING (is_super_admin());
CREATE POLICY "Super Admin Manage All" ON faq_view_logs FOR ALL USING (is_super_admin());

-- (3) 일반 사용자(Authenticated) 쓰기 권한
-- 리뷰 작성: "예약 확정(confirmed)" 된 사용자만 가능 + 본인 확인
CREATE POLICY "User Create Review" ON facility_reviews 
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id
    AND EXISTS (
      SELECT 1 FROM reservations
      WHERE user_id = auth.uid()::text
      AND facility_id = facility_reviews.facility_id::text
      AND status = 'confirmed'
    )
  );

-- 리뷰 수정/삭제: 본인이 작성한 글만 가능
CREATE POLICY "User Update Own Review" ON facility_reviews 
  FOR UPDATE USING (auth.uid()::text = user_id);
  
CREATE POLICY "User Delete Own Review" ON facility_reviews 
  FOR DELETE USING (auth.uid()::text = user_id);

-- 리뷰 도움됨 클릭
CREATE POLICY "User Create Helpful Log" ON review_helpful_logs 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- FAQ 조회 로그 (누구나 생성 가능)
CREATE POLICY "Anyone Create View Log" ON faq_view_logs 
  FOR INSERT WITH CHECK (true);
