-- 1. 체크리스트 진행도 테이블
CREATE TABLE user_admin_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'death_report', 'health_insurance', 'pension', 'banking',
        'tax', 'insurance_claim', 'real_estate', 'vehicle',
        'subscription', 'digital_account', 'inheritance', 'memorial'
    )),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- 2. RLS (패턴 A: 소유자만)
ALTER TABLE user_admin_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_admin_checklists_select_v1
    ON user_admin_checklists FOR SELECT
    TO authenticated
    USING (user_id = public.clerk_user_id());

CREATE POLICY user_admin_checklists_insert_v1
    ON user_admin_checklists FOR INSERT
    TO authenticated
    WITH CHECK (user_id = public.clerk_user_id());

CREATE POLICY user_admin_checklists_update_v1
    ON user_admin_checklists FOR UPDATE
    TO authenticated
    USING (user_id = public.clerk_user_id());

-- 3. 인덱스
CREATE INDEX idx_user_admin_checklists_user
    ON user_admin_checklists(user_id);

-- 4. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_admin_checklist_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admin_checklist_updated
    BEFORE UPDATE ON user_admin_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_checklist_timestamp();
