BEGIN;

-- =============================================
-- RLS 정책 수정: 관리자 테이블 Clerk JWT 호환성
-- =============================================
-- 문제: user_id는 TEXT (Clerk ID: user_xxx), auth.uid()는 UUID
-- 해결: auth.jwt() ->> 'sub'를 사용하여 Clerk ID와 비교

-- =============================================
-- sangjo_hq_admins
-- =============================================
DROP POLICY IF EXISTS "sangjo_admin_select_own" ON sangjo_hq_admins;
CREATE POLICY "sangjo_admin_select_clerk" ON sangjo_hq_admins
  FOR SELECT TO authenticated
  USING (
    user_id = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    )
  );

-- =============================================
-- facility_admins
-- =============================================
DROP POLICY IF EXISTS "facility_admin_select_own" ON facility_admins;
CREATE POLICY "facility_admin_select_clerk" ON facility_admins
  FOR SELECT TO authenticated
  USING (
    user_id = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      auth.uid()::text
    )
  );

-- =============================================
-- sangjo_users (if exists)
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sangjo_users') THEN
    EXECUTE 'DROP POLICY IF EXISTS "sangjo_user_select_own" ON sangjo_users';
    EXECUTE 'CREATE POLICY "sangjo_user_select_clerk" ON sangjo_users
      FOR SELECT TO authenticated
      USING (
        user_id = COALESCE(
          current_setting(''request.jwt.claims'', true)::json->>''sub'',
          auth.uid()::text
        )
      )';
  END IF;
END $$;

COMMIT;
