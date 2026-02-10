-- [Final] Leads 테이블 생성 (ai_summary 제거됨)

-- 기존 테이블이 있다면 삭제 후 재생성 (주의: 기존 데이터 삭제됨)
DROP TABLE IF EXISTS public.leads;

-- 1. 상담 리드(Leads) 테이블 생성
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT, -- [수정] Clerk ID는 UUID가 아닌 TEXT 형식이므로 변경 (FK 제약조건 제거)
    facility_id BIGINT REFERENCES public.memorial_spaces(id) ON DELETE SET NULL, -- 특정 시설 (선택)
    
    -- [필수] 연락처 정보
    contact_name TEXT NOT NULL, 
    contact_phone TEXT NOT NULL, 
    
    -- [상담 메타데이터]
    category TEXT NOT NULL, -- funeral(장례), memorial(봉안당), pet(반려동물)
    urgency TEXT, -- immediate, imminent, prepare
    scale TEXT,   -- small, medium, large
    
    -- [AI 분석 데이터]
    priorities TEXT[], -- ['price', 'distance'] 등 우선순위 태그
    context_data JSONB DEFAULT '{}'::jsonb, -- 기타 세부 정보(지역, 종교, 특이사항 등)
    
    -- [상태 관리]
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'contacted', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- 3. RLS (보안 정책) 설정
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for everyone" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING (auth.uid()::text = user_id);
-- 관리자 조회용 (임시: 모두 허용)
CREATE POLICY "Admins view all" ON public.leads FOR SELECT USING (true);

-- 4. 테스트용 더미 데이터
INSERT INTO public.leads (contact_name, contact_phone, category, urgency, scale, priorities, context_data, status)
VALUES
(
    '김철수', '010-1234-5678', 'funeral', 'immediate', 'medium', 
    ARRAY['location', 'price'], 
    '{"region": "일산", "religion": "기독교", "note": "부친상 임종 직전"}'::jsonb, 
    'new'
),
(
    '이영희', '010-9876-5432', 'memorial', 'prepare', 'small', 
    ARRAY['facility', 'environment'], 
    '{"region": "경기 광주", "preference": "채광 좋은 곳", "note": "사전 답사 희망"}'::jsonb, 
    'contacted'
),
(
    '박민수', '010-5555-4444', 'pet', 'imminent', 'small', 
    ARRAY['price'], 
    '{"weight": "5kg 미만", "species": "강아지", "note": "기본 화장 비용 문의"}'::jsonb, 
    'new'
);
