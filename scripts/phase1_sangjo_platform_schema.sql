-- Phase 1: 추모맵 상조 플랫폼 고도화 스키마

-- 1. 파트너사 (상조 회사) 테이블
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  ai_context JSONB DEFAULT '{}'::jsonb, -- AI 설정 정보 (가격표, 톤앤매너 등)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT -- Clerk User ID or Email
);

-- 2. 상조 계약 및 관제 테이블 (기존 sangjo_contracts 확장 또는 신규 생성 권장)
-- 기존 테이블이 있으므로 컬럼 추가/수정 형식으로 진행
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sangjo_contracts' AND column_name='emergency_level') THEN
        ALTER TABLE sangjo_contracts ADD COLUMN emergency_level TEXT DEFAULT 'normal' CHECK (emergency_level IN ('normal', 'urgent', 'critical'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sangjo_contracts' AND column_name='platform_fee') THEN
        ALTER TABLE sangjo_contracts ADD COLUMN platform_fee NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sangjo_contracts' AND column_name='assigned_counselor') THEN
        ALTER TABLE sangjo_contracts ADD COLUMN assigned_counselor TEXT;
    END IF;
END $$;

-- 3. 실시간 AI 상담 내역 테이블
CREATE TABLE IF NOT EXISTS partner_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  user_id TEXT, -- Clerk User ID
  user_name TEXT,
  user_phone TEXT,
  conversation_status TEXT DEFAULT 'ai_handling' CHECK (conversation_status IN ('ai_handling', 'agent_requested', 'agent_connected', 'closed')),
  messages JSONB DEFAULT '[]'::jsonb, -- [{role: 'user', content: '...'}, {role: 'bot', content: '...'}]
  tags TEXT[] DEFAULT '{}', -- AI가 자동 생성한 태그
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'critical')),
  assigned_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 상조 현장 운영 및 출동 관리 (Kanban 전용)
CREATE TABLE IF NOT EXISTS partner_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  conversation_id UUID REFERENCES partner_conversations(id),
  contract_id UUID REFERENCES sangjo_contracts(id),
  operation_stage TEXT DEFAULT 'pending' CHECK (operation_stage IN ('pending', 'dispatched', 'in_progress', 'completed', 'cancelled')),
  deceased_name TEXT,
  funeral_director TEXT, -- 배정된 장례지도사
  funeral_location TEXT,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  dispatch_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  field_photos TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 슈퍼관리자 공지사항
CREATE TABLE IF NOT EXISTS platform_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  notice_type TEXT DEFAULT 'info' CHECK (notice_type IN ('info', 'warning', 'urgent')),
  target_partner_ids UUID[], -- NULL 이면 전체 공지
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS 설정 및 인덱스 (기본)
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_notices ENABLE ROW LEVEL SECURITY;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_conversations_partner ON partner_conversations(partner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_emergency ON sangjo_contracts(emergency_level);

-- 6. 긴급 알림 트리거 (Critical 등급 발생 시)
CREATE OR REPLACE FUNCTION handle_emergency_contract() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.emergency_level = 'critical' THEN
        -- 여기서 알림 테이블에 저장하거나 외부 API 호출 가능 (Edge Functions)
        -- 현재는 Realtime 구독을 위해 데이터만으로도 충분함
        NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_emergency_alert
AFTER INSERT OR UPDATE ON sangjo_contracts
FOR EACH ROW
WHEN (NEW.emergency_level = 'critical')
EXECUTE FUNCTION handle_emergency_contract();
