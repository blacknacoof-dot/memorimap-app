-- 0. PostGIS & Utility Functions & Table Guard
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- facilities 테이블에 owner_user_id(관리자 ID)가 없을 경우 추가 (TEXT 타입 - Clerk ID 대응)
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'facilities') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='facilities' AND column_name='owner_user_id') THEN
      ALTER TABLE public.facilities ADD COLUMN owner_user_id TEXT;
    END IF;
  END IF;
END $$;

-- 1. Facility Indexing
-- location 컬럼이 geography 타입이어야 합니다.
CREATE INDEX IF NOT EXISTS idx_facilities_location_gist ON public.facilities USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_facilities_category ON public.facilities (category);

-- 2. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 유저 연결 (auth.users UUID 사용)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- 시설 연결 (UUID 타입 일치 필요)
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    
    -- 상담 카테고리
    category TEXT NOT NULL CHECK (category IN ('funeral', 'memorial', 'pet', 'consult')),
    
    -- 긴급도 및 규모
    urgency TEXT CHECK (urgency IN ('immediate', 'imminent', 'prepare')),
    scale TEXT, -- small, medium, large
    
    -- 맥락 데이터 (JSONB로 유연하게 저장)
    context_data JSONB DEFAULT '{}'::jsonb, 
    
    -- 필터링 우선순위
    priorities TEXT[], 
    
    -- 리드 상태
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converting', 'closed', 'rejected')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS Policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- [정책 1] 슈퍼 관리자는 모든 리드 관리 가능
CREATE POLICY "Super Admins can manage all leads" ON public.leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE clerk_id = auth.uid()::text AND role = 'super_admin'
        )
    );

-- [정책 2] 시설 관리자는 본인 시설에 배정된 리드만 조회 가능
CREATE POLICY "Facility Admins can view own leads" ON public.leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.facilities 
            WHERE id = leads.facility_id 
            AND owner_user_id = auth.uid()::text
        )
    );

-- [정책 3] AI 상담봇은 리드 삽입 가능
CREATE POLICY "Allow ChatBot to insert leads" ON public.leads
    FOR INSERT WITH CHECK (true);

-- [정책 4] 일반 사용자는 본인이 상담한 리드 조회 가능
CREATE POLICY "Users can view own leads" ON public.leads
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- 4. Triggers (updated_at 자동 업데이트)
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
