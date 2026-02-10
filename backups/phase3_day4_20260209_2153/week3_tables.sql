-- =============================================
-- Week 3: 필수 테이블 생성 (FIXED for BIGINT facility_id)
-- =============================================
-- Run this in Supabase SQL Editor

-- 1. bot_data 테이블 (챗봇 데이터)
CREATE TABLE IF NOT EXISTS bot_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    facility_id BIGINT NOT NULL,  -- facilities.id is BIGINT
    
    -- 챗봇 설정
    welcome_message TEXT,
    faq_items JSONB DEFAULT '[]'::jsonb,
    ai_context TEXT,
    ai_features JSONB DEFAULT '[]'::jsonb,
    price_info JSONB DEFAULT '{}'::jsonb,
    
    -- 캐시 관리
    bot_last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(facility_id)
);

-- 2. timeline_events 테이블 (장례 일정 타임라인)
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 관계 (facility_id는 BIGINT)
    facility_id BIGINT NOT NULL,
    reservation_id UUID,
    user_id UUID REFERENCES auth.users(id),
    
    -- 이벤트 정보
    event_type TEXT NOT NULL, -- 'admission', 'encoffin', 'funeral', 'cremation', 'burial'
    event_title TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- 상태
    status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    notes TEXT,
    
    CONSTRAINT valid_event_type CHECK (event_type IN ('admission', 'encoffin', 'funeral', 'cremation', 'burial', 'other')),
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- 3. facility_submissions 테이블 (시설 입점 신청)
CREATE TABLE IF NOT EXISTS facility_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 신청자 정보
    applicant_user_id UUID REFERENCES auth.users(id),
    applicant_name TEXT NOT NULL,
    applicant_phone TEXT NOT NULL,
    applicant_email TEXT,
    
    -- 시설 정보
    facility_name TEXT NOT NULL,
    facility_type TEXT NOT NULL, -- funeral, memorial, charnel, sangjo, pet
    facility_address TEXT NOT NULL,
    business_number TEXT, -- 사업자등록번호
    
    -- 첨부 파일
    documents JSONB DEFAULT '[]'::jsonb, -- [{url, name, type}]
    
    -- 심사 상태
    status TEXT DEFAULT 'pending', -- pending, reviewing, approved, rejected
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    CONSTRAINT valid_facility_type CHECK (facility_type IN ('funeral', 'memorial', 'charnel', 'sangjo', 'pet', 'natural', 'sea')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected'))
);

-- 4. notification_logs 테이블 (알림 발송 로그)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 대상
    user_id UUID REFERENCES auth.users(id),
    facility_id BIGINT,  -- BIGINT to match facilities.id
    
    -- 알림 내용
    notification_type TEXT NOT NULL, -- timeline_update, reservation_status, consultation_new
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    
    -- 발송 상태
    status TEXT DEFAULT 'pending', -- pending, sent, failed, cancelled
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- 관련 리소스
    related_type TEXT, -- timeline_event, reservation, consultation
    related_id UUID,
    
    CONSTRAINT valid_notification_type CHECK (notification_type IN ('timeline_update', 'reservation_status', 'consultation_new', 'system')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bot_data_facility ON bot_data(facility_id);
CREATE INDEX IF NOT EXISTS idx_timeline_facility ON timeline_events(facility_id);
CREATE INDEX IF NOT EXISTS idx_timeline_reservation ON timeline_events(reservation_id);
CREATE INDEX IF NOT EXISTS idx_timeline_user ON timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_submissions_status ON facility_submissions(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);

-- Updated at 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
DROP TRIGGER IF EXISTS trigger_bot_data_updated_at ON bot_data;
CREATE TRIGGER trigger_bot_data_updated_at
    BEFORE UPDATE ON bot_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_timeline_events_updated_at ON timeline_events;
CREATE TRIGGER trigger_timeline_events_updated_at
    BEFORE UPDATE ON timeline_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_facility_submissions_updated_at ON facility_submissions;
CREATE TRIGGER trigger_facility_submissions_updated_at
    BEFORE UPDATE ON facility_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Week 3 tables created successfully!' as message;
