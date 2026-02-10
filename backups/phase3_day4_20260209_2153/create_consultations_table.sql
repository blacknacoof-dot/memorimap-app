-- =============================================
-- Consultations Table for Funeral Service
-- =============================================
-- Run this in Supabase SQL Editor

-- Drop existing table and policies if they exist (for clean restart)
DROP TABLE IF EXISTS consultations CASCADE;

-- Create consultations table
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Facility info
    facility_id TEXT NOT NULL,
    facility_name TEXT,
    
    -- User info
    user_id UUID REFERENCES auth.users(id),
    user_phone TEXT,
    user_name TEXT,
    
    -- Consultation details
    urgency TEXT,           -- deceased, imminent, inquiry
    location TEXT,          -- 고인 계신 곳
    needs_ambulance BOOLEAN DEFAULT FALSE,
    scale TEXT,             -- small, medium, large
    religion TEXT,          -- buddhist, christian, catholic, none
    schedule TEXT,          -- 3day, 2day, other
    
    -- Status management
    status TEXT DEFAULT 'waiting',  -- waiting, accepted, cancelled, completed
    notes TEXT,             -- 담당자 메모
    
    CONSTRAINT valid_status CHECK (status IN ('waiting', 'accepted', 'cancelled', 'completed'))
);

-- Create index for faster queries
CREATE INDEX idx_consultations_facility ON consultations(facility_id);
CREATE INDEX idx_consultations_user ON consultations(user_id);
CREATE INDEX idx_consultations_status ON consultations(status);

-- Enable RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Simplified)

-- All authenticated users can view consultations (for dashboard and my page)
CREATE POLICY "Authenticated can view all consultations"
ON consultations FOR SELECT
TO authenticated
USING (true);

-- All authenticated users can create consultations
CREATE POLICY "Authenticated can create consultations"
ON consultations FOR INSERT
TO authenticated
WITH CHECK (true);

-- All authenticated users can update consultations
CREATE POLICY "Authenticated can update consultations"
ON consultations FOR UPDATE
TO authenticated
USING (true);

-- Anonymous users can create consultations (for non-logged-in users)
CREATE POLICY "Anonymous can create consultations"
ON consultations FOR INSERT
TO anon
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON consultations TO authenticated;
GRANT INSERT ON consultations TO anon;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_consultations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_consultations_updated_at();

-- Success message
SELECT 'Consultations table created successfully!' as message;
