-- Add columns to consultation_leads for Assignments and CRM
ALTER TABLE consultation_leads 
ADD COLUMN IF NOT EXISTS assigned_partner_id UUID REFERENCES funeral_companies(id), -- Assuming funeral_companies has UUID id
ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'NORMAL', -- 'CRITICAL', 'HIGH', 'NORMAL'
ADD COLUMN IF NOT EXISTS fail_reason TEXT,
ADD COLUMN IF NOT EXISTS contract_amount NUMERIC,
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS consultation_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create Status Enum if not exists (or you can use text check constraint)
-- ALTER TYPE consultation_status ADD VALUE IF NOT EXISTS 'consulting'; -- If using ENUM

-- Add RLS Policies for Partners
-- Allow Partners to View and Update assigned leads
CREATE POLICY "Partners can view assigned leads" ON consultation_leads
FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM funeral_company_users WHERE company_id = assigned_partner_id
));

CREATE POLICY "Partners can update assigned leads" ON consultation_leads
FOR UPDATE
USING (auth.uid() IN (
    SELECT user_id FROM funeral_company_users WHERE company_id = assigned_partner_id
));
