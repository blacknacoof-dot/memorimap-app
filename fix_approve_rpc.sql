-- Fix: approve_partner_and_grant_role RPC 함수의 파라미터 타입 수정
-- partner_inquiries.id는 BIGINT인데 RPC가 UUID를 기대하고 있음

-- 1. 기존 함수 삭제 (있으면)
DROP FUNCTION IF EXISTS approve_partner_and_grant_role(UUID, TEXT);

-- 2. 새 함수 생성 (BIGINT 파라미터 사용)
CREATE OR REPLACE FUNCTION approve_partner_and_grant_role(
    inquiry_id BIGINT,
    target_user_id TEXT
)
RETURNS VOID AS $$
BEGIN
    -- 1. partner_inquiries 상태를 'approved'로 변경
    UPDATE partner_inquiries 
    SET status = 'approved', 
        approved_at = NOW()
    WHERE id = inquiry_id;
    
    -- 2. 해당 유저의 역할을 'facility_admin'으로 승격
    UPDATE profiles 
    SET role = 'facility_admin'
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 함수 권한 부여
GRANT EXECUTE ON FUNCTION approve_partner_and_grant_role(BIGINT, TEXT) TO authenticated;

-- 4. 확인
SELECT proname, proargtypes::regtype[] 
FROM pg_proc 
WHERE proname = 'approve_partner_and_grant_role';
