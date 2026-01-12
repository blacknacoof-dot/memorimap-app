-- =============================================
-- Week 3: RLS Policies (FIXED for BIGINT facility_id)
-- =============================================
-- Run this in Supabase SQL Editor AFTER week3_tables.sql

-- Enable RLS on all tables
ALTER TABLE bot_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 1. bot_data RLS Policies
-- - 읽기: 모든 사용자 (익명 포함)
-- - 쓰기: 시설 소유자만
-- =============================================

-- 누구나 읽기 가능
CREATE POLICY "Anyone can read bot_data"
ON bot_data FOR SELECT
TO public
USING (true);

-- 시설 소유자만 INSERT
CREATE POLICY "Facility owner can insert bot_data"
ON bot_data FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM facilities f
        WHERE f.id = bot_data.facility_id
        AND f.owner_user_id = auth.uid()
    )
);

-- 시설 소유자만 UPDATE
CREATE POLICY "Facility owner can update bot_data"
ON bot_data FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM facilities f
        WHERE f.id = bot_data.facility_id
        AND f.owner_user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM facilities f
        WHERE f.id = bot_data.facility_id
        AND f.owner_user_id = auth.uid()
    )
);

-- 시설 소유자만 DELETE
CREATE POLICY "Facility owner can delete bot_data"
ON bot_data FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM facilities f
        WHERE f.id = bot_data.facility_id
        AND f.owner_user_id = auth.uid()
    )
);

-- =============================================
-- 2. timeline_events RLS Policies
-- - 읽기: 시설 소유자 OR 해당 예약 사용자
-- - 쓰기: 시설 소유자만
-- =============================================

-- 시설 소유자 또는 해당 유저만 읽기
CREATE POLICY "Owner or user can read timeline_events"
ON timeline_events FOR SELECT
TO authenticated
USING (
    -- 시설 소유자
    EXISTS (
        SELECT 1 FROM facilities f
        WHERE f.id = timeline_events.facility_id
        AND f.owner_user_id = auth.uid()
    )
    OR
    -- 해당 예약의 사용자
    user_id = auth.uid()
);

-- 시설 소유자만 INSERT
CREATE POLICY "Facility owner can insert timeline_events"
ON timeline_events FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM facilities f
        WHERE f.id = timeline_events.facility_id
        AND f.owner_user_id = auth.uid()
    )
);

-- 시설 소유자만 UPDATE
CREATE POLICY "Facility owner can update timeline_events"
ON timeline_events FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM facilities f
        WHERE f.id = timeline_events.facility_id
        AND f.owner_user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM facilities f
        WHERE f.id = timeline_events.facility_id
        AND f.owner_user_id = auth.uid()
    )
);

-- 시설 소유자만 DELETE
CREATE POLICY "Facility owner can delete timeline_events"
ON timeline_events FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM facilities f
        WHERE f.id = timeline_events.facility_id
        AND f.owner_user_id = auth.uid()
    )
);

-- =============================================
-- 3. facility_submissions RLS Policies
-- - 읽기: 슈퍼 관리자 OR 본인 신청 건
-- - 쓰기 (INSERT): 인증된 사용자 (신청)
-- - 쓰기 (UPDATE): 슈퍼 관리자만
-- =============================================

-- 슈퍼 관리자 확인 함수
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- profiles 테이블이 없을 수 있으므로 예외 처리
    RETURN EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid()
        AND p.role = 'super_admin'
    );
EXCEPTION
    WHEN undefined_table THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 슈퍼 관리자 또는 본인 신청 건 읽기
CREATE POLICY "Admin or applicant can read submissions"
ON facility_submissions FOR SELECT
TO authenticated
USING (
    is_super_admin()
    OR applicant_user_id = auth.uid()
);

-- 인증된 사용자는 신청 가능
CREATE POLICY "Authenticated users can submit"
ON facility_submissions FOR INSERT
TO authenticated
WITH CHECK (
    applicant_user_id = auth.uid()
);

-- 슈퍼 관리자만 UPDATE (승인/거절)
CREATE POLICY "Only super admin can update submissions"
ON facility_submissions FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 슈퍼 관리자만 DELETE
CREATE POLICY "Only super admin can delete submissions"
ON facility_submissions FOR DELETE
TO authenticated
USING (is_super_admin());

-- =============================================
-- 4. notification_logs RLS Policies
-- - 읽기: 본인 알림만
-- - 쓰기: 시스템 (서비스 역할)
-- =============================================

-- 본인 알림만 읽기
CREATE POLICY "Users can read own notifications"
ON notification_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT는 서비스 역할로만 (RLS 우회)
-- Edge Function에서 service_role key 사용

-- =============================================
-- Grant Permissions
-- =============================================
GRANT SELECT ON bot_data TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON bot_data TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON timeline_events TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON facility_submissions TO authenticated;

GRANT SELECT ON notification_logs TO authenticated;

SELECT 'Week 3 RLS policies applied successfully!' as message;
