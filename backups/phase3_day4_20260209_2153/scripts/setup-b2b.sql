-- 1. memorial_spaces 테이블 확장
ALTER TABLE memorial_spaces ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE memorial_spaces ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'ai';
ALTER TABLE memorial_spaces ADD COLUMN IF NOT EXISTS price_info JSONB DEFAULT '[]';
ALTER TABLE memorial_spaces ADD COLUMN IF NOT EXISTS ai_context TEXT;
ALTER TABLE memorial_spaces ADD COLUMN IF NOT EXISTS owner_user_id TEXT;

-- 2. 업체 관리 권한 테이블 생성
CREATE TABLE IF NOT EXISTS facility_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- clerk_id
    facility_id BIGINT REFERENCES memorial_spaces(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT false,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, facility_id)
);

-- 3. RLS 설정 (필요시)
ALTER TABLE facility_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
    ON facility_admins FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Super Admins can manage all requests"
    ON facility_admins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE clerk_id = auth.uid()::text
            AND role = 'super_admin'
        )
    );
