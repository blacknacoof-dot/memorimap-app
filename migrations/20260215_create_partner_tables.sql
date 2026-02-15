-- ============================================
-- 누락 테이블 생성: partners, partner_conversations, partner_operations
-- sangjo_hq_admins에 company_name 컬럼 보장
-- 실행: Supabase SQL Editor에서 실행
-- ============================================

-- 1. partners 테이블 (상조 파트너사)
-- 코드에서 id=TEXT('a-sangjo' 등)로 조회하므로 TEXT PK 사용
CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  funeral_location TEXT,
  ai_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by TEXT
);

-- 2. partner_conversations 테이블 (AI 상담 내역)
CREATE TABLE IF NOT EXISTS partner_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT REFERENCES partners(id),
  user_id TEXT,
  user_name TEXT,
  user_phone TEXT,
  conversation_status TEXT DEFAULT 'ai_handling' CHECK (conversation_status IN ('ai_handling', 'agent_requested', 'agent_connected', 'closed')),
  messages JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'critical')),
  assigned_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. partner_operations 테이블 (현장 운영/출동)
CREATE TABLE IF NOT EXISTS partner_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT REFERENCES partners(id),
  conversation_id UUID,
  contract_id UUID,
  operation_stage TEXT DEFAULT 'pending' CHECK (operation_stage IN ('pending', 'dispatched', 'in_progress', 'completed', 'cancelled')),
  deceased_name TEXT,
  funeral_director TEXT,
  funeral_location TEXT,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  dispatch_time TIMESTAMPTZ,
  completion_time TIMESTAMPTZ,
  field_photos TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. sangjo_hq_admins에 company_name 컬럼 보장
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sangjo_hq_admins' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE sangjo_hq_admins ADD COLUMN company_name TEXT;
  END IF;
END $$;

-- 5. 인덱스
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partner_conversations_partner ON partner_conversations(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_conversations_last_msg ON partner_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_operations_partner ON partner_operations(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_operations_stage ON partner_operations(operation_stage);

-- 6. RLS 활성화
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_operations ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 (clerk_user_id() 사용!)

-- partners: 본인 파트너 조회 (sangjo_hq_admins 기반)
CREATE POLICY "partners_select_own" ON partners
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT sangjo_id FROM sangjo_hq_admins WHERE user_id = public.clerk_user_id())
    OR is_super_admin()
  );

CREATE POLICY "partners_update_own" ON partners
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT sangjo_id FROM sangjo_hq_admins WHERE user_id = public.clerk_user_id())
    OR is_super_admin()
  );

-- 슈퍼관리자: partners 전체 관리
CREATE POLICY "partners_super_admin_all" ON partners
  FOR ALL TO authenticated
  USING (is_super_admin());

-- partner_conversations: 본인 파트너의 대화
CREATE POLICY "partner_conv_select_own" ON partner_conversations
  FOR SELECT TO authenticated
  USING (
    partner_id IN (SELECT sangjo_id FROM sangjo_hq_admins WHERE user_id = public.clerk_user_id())
    OR is_super_admin()
  );

CREATE POLICY "partner_conv_insert_own" ON partner_conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    partner_id IN (SELECT sangjo_id FROM sangjo_hq_admins WHERE user_id = public.clerk_user_id())
    OR is_super_admin()
  );

CREATE POLICY "partner_conv_update_own" ON partner_conversations
  FOR UPDATE TO authenticated
  USING (
    partner_id IN (SELECT sangjo_id FROM sangjo_hq_admins WHERE user_id = public.clerk_user_id())
    OR is_super_admin()
  );

-- partner_operations: 본인 파트너의 운영
CREATE POLICY "partner_ops_select_own" ON partner_operations
  FOR SELECT TO authenticated
  USING (
    partner_id IN (SELECT sangjo_id FROM sangjo_hq_admins WHERE user_id = public.clerk_user_id())
    OR is_super_admin()
  );

CREATE POLICY "partner_ops_insert_own" ON partner_operations
  FOR INSERT TO authenticated
  WITH CHECK (
    partner_id IN (SELECT sangjo_id FROM sangjo_hq_admins WHERE user_id = public.clerk_user_id())
    OR is_super_admin()
  );

CREATE POLICY "partner_ops_update_own" ON partner_operations
  FOR UPDATE TO authenticated
  USING (
    partner_id IN (SELECT sangjo_id FROM sangjo_hq_admins WHERE user_id = public.clerk_user_id())
    OR is_super_admin()
  );

-- ============================================
-- Supabase SQL Editor에서 실행하세요.
-- ============================================
