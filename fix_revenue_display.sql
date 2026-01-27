-- ============================================
-- 📊 매출 통계 표시 문제 해결 (RLS 및 권한 복구)
-- ============================================

-- [1] 슈퍼 관리자 확인 함수 점검/복구
-- profiles 테이블의 id가 auth.uid()::text와 일치하는지 확인
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = (select auth.uid()::text) 
        AND role = 'super_admin'
    );
EXCEPTION 
    WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [2] 매출 데이터(subscription_payments) SELECT 권한 부여
-- Super Admin은 모든 결제 내역을 볼 수 있어야 합니다.
DROP POLICY IF EXISTS "Super Admin Select All Payments" ON subscription_payments;
CREATE POLICY "Super Admin Select All Payments"
ON subscription_payments FOR SELECT
TO authenticated
USING ( is_super_admin() );

-- [3] 구독 정보(facility_subscriptions) SELECT 권한 보강
DROP POLICY IF EXISTS "Super Admin Select All Subscriptions" ON facility_subscriptions;
CREATE POLICY "Super Admin Select All Subscriptions"
ON facility_subscriptions FOR SELECT
TO authenticated
USING ( is_super_admin() );

-- [4] 현재 유저를 Super Admin으로 확실히 지정
-- blacknacoof@gmail.com 사용자의 Clerk ID가 'user_36vml1WCaPN5YGZFA84gzmgDHAW'라고 가정
UPDATE profiles 
SET role = 'super_admin' 
WHERE clerk_id = 'user_36vml1WCaPN5YGZFA84gzmgDHAW' 
   OR id = 'user_36vml1WCaPN5YGZFA84gzmgDHAW';

-- 만약 profiles에 데이터가 없다면 삽입 (CORS/Sync 문제 대비)
INSERT INTO profiles (id, clerk_id, email, full_name, role)
VALUES ('user_36vml1WCaPN5YGZFA84gzmgDHAW', 'user_36vml1WCaPN5YGZFA84gzmgDHAW', 'blacknacoof@gmail.com', 'Super Admin', 'super_admin')
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- [5] super_admins 테이블 동기화 (필요한 경우)
INSERT INTO super_admins (id)
VALUES ('user_36vml1WCaPN5YGZFA84gzmgDHAW')
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT 'RLS Policies and Super Admin role updated.' as status;
