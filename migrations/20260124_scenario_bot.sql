-- ==============================================================================
-- Migration: Pivot to Scenario Bot (Rule-based) [SECURE VERSION]
-- Description: Replaces complex AI context with a structured JSON scenario table.
--              Includes strict RLS, JSON validation, and Text-based ID support.
-- Date: 2026-01-24
-- ==============================================================================

-- 0. Admin Roles Table (Security Enhanced)
CREATE TABLE IF NOT EXISTS admin_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('super_admin', 'support')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- [Fix] Service Role manages admin roles
DROP POLICY IF EXISTS "Service role manage admin_roles" ON admin_roles;
CREATE POLICY "Service role manage admin_roles" ON admin_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- [Fix] Authenticated users can only view their own role
DROP POLICY IF EXISTS "Users view own admin role" ON admin_roles;
CREATE POLICY "Users view own admin role" ON admin_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());


-- 1. Create the scenario table
-- [Fix] Changed facility_id to TEXT to support 'maum-i' and other string inputs.
-- [Note] Removed Foreign Key to facilities(id) to allow 'maum-i' if it's not in facilities table yet.
CREATE TABLE IF NOT EXISTS facility_scenarios (
    facility_id TEXT PRIMARY KEY, 
    scenario_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- [Security] Limit JSON size to 50KB & Ensure structure
    CONSTRAINT scenario_size_check CHECK (octet_length(scenario_data::text) < 51200),
    CONSTRAINT scenario_structure_check CHECK (scenario_data ? 'start_node')
);

-- 2. Enable RLS
ALTER TABLE facility_scenarios ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (Split by Action)

-- Policy A: Public View (SELECT only)
CREATE POLICY "Public view scenarios" ON facility_scenarios
FOR SELECT
TO anon, authenticated
USING (true); 

-- Policy B: Facility Managers (INSERT/UPDATE/DELETE)
-- Note: Assuming facility_managers.facility_id matches type of facility_scenarios.facility_id (casting if needed)
CREATE POLICY "Managers modify scenarios" ON facility_scenarios
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
    facility_id IN (
        SELECT facility_id::text FROM facility_managers 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    facility_id IN (
        SELECT facility_id::text FROM facility_managers 
        WHERE user_id = auth.uid()
    )
);

-- Policy C: Super Admin Full Access (Select/Insert/Update/Delete)
CREATE POLICY "Super Admin Full Access" ON facility_scenarios
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- 4. Triggers for updated_at
CREATE OR REPLACE FUNCTION facility_scenarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_facility_scenarios_updated_at ON facility_scenarios;
CREATE TRIGGER trg_facility_scenarios_updated_at
BEFORE UPDATE ON facility_scenarios
FOR EACH ROW
EXECUTE FUNCTION facility_scenarios_updated_at();


-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_facility_scenarios_facility_id ON facility_scenarios(facility_id);
-- Compound index for managers check
CREATE INDEX IF NOT EXISTS idx_facility_managers_user_id ON facility_managers(user_id);


-- 6. Initial Seed for Maum-i (Always Insert/Update to ensure availability)
INSERT INTO facility_scenarios (facility_id, scenario_data)
VALUES (
    'maum-i',
    '{
        "start_node": "welcome",
        "nodes": {
            "welcome": {
                "message": "안녕하세요. **통합 AI 마음이**입니다. 무엇을 도와드릴까요?",
                "options": [
                    { "label": "🏢 장례식장 찾기", "next": "find_funeral", "action": "SHOW_FORM_A" },
                    { "label": "🌲 추모시설 찾기", "next": "find_memorial", "action": "SHOW_FORM_B" },
                    { "label": "🐶 동물장례", "next": "pet_funeral", "action": "Mode_Pet" },
                    { "label": "💬 기타/상담", "next": "consult_chat", "action": "OPEN_CONSULT_FORM" }
                ]
            },
            "find_funeral": { "message": "장례식장을 찾으시나요?", "options": [{ "label": "조건 입력하기", "next": "welcome", "action": "SHOW_FORM_A" }] },
            "find_memorial": { "message": "추모시설을 찾아드릴까요?", "options": [{ "label": "조건 입력하기", "next": "welcome", "action": "SHOW_FORM_B" }] },
            "pet_funeral": { "message": "반려동물 장례식장 찾기", "options": [{ "label": "가까운 곳 찾기", "next": "welcome", "action": "RECOMMEND_PET" }] },
            "consult_chat": { "message": "직접 상담하시겠습니까?", "options": [{ "label": "상담 신청하기", "next": "welcome", "action": "OPEN_CONSULT_FORM" }] }
        }
    }'::jsonb
)
ON CONFLICT (facility_id) DO UPDATE
SET scenario_data = EXCLUDED.scenario_data;
