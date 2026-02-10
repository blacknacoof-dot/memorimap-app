-- 1. [Leads] 상담 리드 테이블 (JSONB 컨텍스트 포함)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT, -- Clerk ID (nullable)
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    category TEXT NOT NULL, -- funeral, memorial, pet, general
    urgency TEXT, -- immediate, prepare
    scale TEXT,
    priorities TEXT[], -- ['price', 'distance']
    context_data JSONB DEFAULT '{}'::jsonb, -- AI 수집 데이터 (지역, 종교, 펫 정보 등)
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. [Consultations] 상담 테이블 (시설별 매핑)
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id), -- 리드 연결
    facility_id UUID REFERENCES public.facilities(id),
    user_id UUID REFERENCES auth.users(id), -- Supabase Auth (Option)
    user_name TEXT,
    user_phone TEXT,
    status TEXT DEFAULT 'pending',
    data JSONB DEFAULT '{}'::jsonb, -- 핸드오버된 최종 데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. [Facilities] 컬럼 확장 (서비스 태그, 상담 템플릿)
ALTER TABLE public.facilities 
ADD COLUMN IF NOT EXISTS services TEXT[],
ADD COLUMN IF NOT EXISTS consultation_template JSONB DEFAULT '{}'::jsonb;

-- 4. [Region List] 지역 목록 (자동완성 & 스마트 필터링용)
-- (기존 getDistinctRegions 함수가 facilities 테이블을 직접 조회하므로, 별도 테이블보다는 Materialized View가 나을 수 있으나,
-- 여기서는 사용자 요청에 따라 별도 테이블로 구성하여 캐싱 성능 확보)
CREATE TABLE IF NOT EXISTS public.region_stats (
    region_name TEXT PRIMARY KEY, -- '경기도 용인시'
    funeral_count INT DEFAULT 0,
    memorial_count INT DEFAULT 0,
    pet_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. [Function] Deep Handover (리드 -> 상담 전환)
CREATE OR REPLACE FUNCTION public.create_consultation_from_lead(
    p_lead_id UUID,
    p_facility_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead public.leads%ROWTYPE;
    v_new_consultation_id UUID;
    v_merged_data JSONB;
BEGIN
    -- 1. 리드 정보 조회
    SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;

    -- 2. 데이터 병합 (context_data를 기본으로 하되, 필요 시 템플릿과 병합 로직 추가 가능)
    v_merged_data := v_lead.context_data || jsonb_build_object(
        'source_lead_id', v_lead.id,
        'original_category', v_lead.category,
        'handover_at', NOW()
    );

    -- 3. 상담 테이블 생성 (초안 상태)
    INSERT INTO public.consultations (
        lead_id, facility_id, user_name, user_phone, status, data
    ) VALUES (
        p_lead_id, p_facility_id, v_lead.contact_name, v_lead.contact_phone, 'draft', v_merged_data
    )
    RETURNING id INTO v_new_consultation_id;

    -- 4. 리드 상태 업데이트
    UPDATE public.leads SET status = 'handed_over' WHERE id = p_lead_id;

    RETURN v_new_consultation_id;
END;
$$;

-- 6. RLS 설정 (기본)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own leads" ON public.leads FOR SELECT USING (user_id = auth.uid()::text);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own consultations" ON public.consultations FOR SELECT USING (user_id = auth.uid());
