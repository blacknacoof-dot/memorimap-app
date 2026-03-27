-- ============================================================
-- facility_subscriptions RLS 정책 수정
-- 문제: auth.jwt() ->> 'sub' 직접 사용 → is_super_admin() / clerk_user_id() 불일치
-- 해결: is_super_admin() 함수 사용 + sangjo_hq_admins 소유자 지원 추가
-- funeral_companies에는 user_id 컬럼 없음 → sangjo_hq_admins로만 소유권 확인
-- ============================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "manage_own_subscriptions_or_admin" ON facility_subscriptions;
DROP POLICY IF EXISTS "facility_sub_select_v2" ON facility_subscriptions;
DROP POLICY IF EXISTS "facility_sub_insert_v2" ON facility_subscriptions;
DROP POLICY IF EXISTS "facility_sub_update_v2" ON facility_subscriptions;
DROP POLICY IF EXISTS "facility_sub_delete_v2" ON facility_subscriptions;

-- SELECT
CREATE POLICY "facility_sub_select_v2" ON facility_subscriptions
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id::text = facility_subscriptions.facility_id_uuid::text
        AND f.user_id = clerk_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM sangjo_hq_admins sha
      WHERE sha.sangjo_id::text = facility_subscriptions.facility_id_uuid::text
        AND sha.user_id = clerk_user_id()
    )
  );

-- INSERT
CREATE POLICY "facility_sub_insert_v2" ON facility_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id::text = facility_subscriptions.facility_id_uuid::text
        AND f.user_id = clerk_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM sangjo_hq_admins sha
      WHERE sha.sangjo_id::text = facility_subscriptions.facility_id_uuid::text
        AND sha.user_id = clerk_user_id()
    )
  );

-- UPDATE
CREATE POLICY "facility_sub_update_v2" ON facility_subscriptions
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id::text = facility_subscriptions.facility_id_uuid::text
        AND f.user_id = clerk_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM sangjo_hq_admins sha
      WHERE sha.sangjo_id::text = facility_subscriptions.facility_id_uuid::text
        AND sha.user_id = clerk_user_id()
    )
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id::text = facility_subscriptions.facility_id_uuid::text
        AND f.user_id = clerk_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM sangjo_hq_admins sha
      WHERE sha.sangjo_id::text = facility_subscriptions.facility_id_uuid::text
        AND sha.user_id = clerk_user_id()
    )
  );

-- DELETE
CREATE POLICY "facility_sub_delete_v2" ON facility_subscriptions
  FOR DELETE TO authenticated
  USING (is_super_admin());
