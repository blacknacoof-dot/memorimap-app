-- ============================================================
-- 20260320_assign_freedlife_sangjo_admin.sql
-- black23007@naver.com → 프리드라이프 상조 관리자 지정 (테스트용)
-- ============================================================

-- 1. profiles role을 sangjo_hq_admin으로 변경
--    (트리거 일시 비활성화 → 변경 → 복원)
ALTER TABLE profiles DISABLE TRIGGER trigger_prevent_role_escalation;

UPDATE profiles
SET role = 'sangjo_hq_admin'::user_role, updated_at = now()
WHERE clerk_id = 'c96afa2f-c10a-41c4-bd8d-2f1e3a90f5fb';

ALTER TABLE profiles ENABLE TRIGGER trigger_prevent_role_escalation;

-- 2. sangjo_hq_admins 등록
INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
VALUES ('c96afa2f-c10a-41c4-bd8d-2f1e3a90f5fb', '7fd43013-842d-4cbb-94ca-8ca0dc3ac785', '프리드라이프', 'hq_admin')
ON CONFLICT DO NOTHING;

-- 3. sangjo_dashboard_users 등록
INSERT INTO sangjo_dashboard_users (id, sangjo_id, role, name)
VALUES ('c96afa2f-c10a-41c4-bd8d-2f1e3a90f5fb', '7fd43013-842d-4cbb-94ca-8ca0dc3ac785', 'admin', '프리드라이프')
ON CONFLICT (id) DO UPDATE SET sangjo_id = EXCLUDED.sangjo_id, role = EXCLUDED.role;

-- 4. 중복 profiles 정리 (clerk_id NULL인 행)
DELETE FROM profiles
WHERE email = 'black23007@naver.com' AND clerk_id IS NULL;

-- 5. 검증
SELECT p.clerk_id, p.role, s.sangjo_id, s.company_name
FROM profiles p
LEFT JOIN sangjo_hq_admins s ON s.user_id = p.clerk_id
WHERE p.clerk_id = 'c96afa2f-c10a-41c4-bd8d-2f1e3a90f5fb';
