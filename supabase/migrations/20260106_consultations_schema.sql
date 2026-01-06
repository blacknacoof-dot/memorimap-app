-- 기존 consultations 테이블이 있다면, facility_id가 facilities 테이블을 참조하도록 수정해야 합니다.
-- 안전하게 새로 만드는 방식을 권장합니다 (기존 데이터가 중요하지 않다면).

CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE, -- 새로운 facilities 테이블 연결
    user_name TEXT,
    user_phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_consultations_user ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_facility ON public.consultations(facility_id);

