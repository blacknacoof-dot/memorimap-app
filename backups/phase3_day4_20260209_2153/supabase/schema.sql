-- =============================================
-- Memorimap Database Schema
-- Last Updated: 2026-01-12
-- =============================================
-- 이 파일은 모든 SQL 마이그레이션을 통합한 백업 파일입니다.
-- Git 백업 시 함께 저장됩니다.

-- =============================================
-- 🔹 Week 2: Consultations (상담 접수)
-- =============================================

CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    facility_id TEXT NOT NULL,
    facility_name TEXT,
    user_id UUID REFERENCES auth.users(id),
    user_phone TEXT,
    user_name TEXT,
    urgency TEXT,
    location TEXT,
    needs_ambulance BOOLEAN DEFAULT FALSE,
    scale TEXT,
    religion TEXT,
    schedule TEXT,
    status TEXT DEFAULT 'waiting',
    notes TEXT,
    CONSTRAINT valid_status CHECK (status IN ('waiting', 'accepted', 'cancelled', 'completed'))
);

-- =============================================
-- 🔹 Week 3: Bot Data, Timeline, Submissions
-- =============================================

-- bot_data: 챗봇 설정
CREATE TABLE IF NOT EXISTS bot_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    facility_id BIGINT NOT NULL,
    welcome_message TEXT,
    faq_items JSONB DEFAULT '[]'::jsonb,
    ai_context TEXT,
    ai_features JSONB DEFAULT '[]'::jsonb,
    price_info JSONB DEFAULT '{}'::jsonb,
    bot_last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(facility_id)
);

-- timeline_events: 장례 일정
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    facility_id BIGINT NOT NULL,
    reservation_id UUID,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    event_title TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled',
    notes TEXT
);

-- facility_submissions: 입점 신청
CREATE TABLE IF NOT EXISTS facility_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    applicant_user_id UUID REFERENCES auth.users(id),
    applicant_name TEXT NOT NULL,
    applicant_phone TEXT NOT NULL,
    applicant_email TEXT,
    facility_name TEXT NOT NULL,
    facility_type TEXT NOT NULL,
    facility_address TEXT NOT NULL,
    business_number TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT
);

-- notification_logs: 알림 로그
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    facility_id BIGINT,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    related_type TEXT,
    related_id UUID
);

-- =============================================
-- 🔹 RLS Policies Summary
-- =============================================
-- consultations: authenticated users can CRUD
-- bot_data: anyone SELECT, owner INSERT/UPDATE/DELETE
-- timeline_events: owner/user SELECT, owner INSERT/UPDATE/DELETE
-- facility_submissions: super_admin UPDATE, applicant SELECT own
-- notification_logs: user SELECT own

-- =============================================
-- 🔹 Stored Procedures
-- =============================================
-- update_timeline_and_notify(event_id, scheduled_at, status, notes)
-- create_default_timeline_events(reservation_id, facility_id, user_id, start_date, schedule_type)
-- is_super_admin() -> BOOLEAN

-- =============================================
-- End of Schema
-- =============================================
