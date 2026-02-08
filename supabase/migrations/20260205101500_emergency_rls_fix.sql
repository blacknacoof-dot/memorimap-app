-- ============================================================
-- CRITICAL: Emergency RLS Policy Fixes (V4 - FIXED TYPE CASTS)
-- Priority 1: Payment Security & Public Write Access
-- ============================================================

-- ============================================================
-- PRIORITY 1: SUBSCRIPTION_PAYMENTS (CRITICAL)
-- Fix: Use logic based on facility ownership via facility_admins
-- ============================================================

DROP POLICY IF EXISTS "Enable all access for public users" ON subscription_payments;
DROP POLICY IF EXISTS "Enable insert for public" ON subscription_payments;
DROP POLICY IF EXISTS "Enable select for all" ON subscription_payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON subscription_payments;

-- View: Authenticated user who is an admin of the related facility
CREATE POLICY "authenticated_select_own_payments" ON subscription_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM facility_subscriptions fs
      JOIN facility_admins fa ON fs.facility_id::text = fa.facility_id::text -- Cast both to text to be safe
      WHERE fs.id = subscription_payments.subscription_id
      AND fa.user_id::uuid = auth.uid()
    )
  );

-- Service Role full access
CREATE POLICY "service_role_full_access" ON subscription_payments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PRIORITY 2: CONSULTATIONS
-- ============================================================

DROP POLICY IF EXISTS "Enable all for public users" ON consultations;
DROP POLICY IF EXISTS "Enable insert for anon users" ON consultations;
DROP POLICY IF EXISTS "Enable read access for all" ON consultations;

CREATE POLICY "authenticated_insert_own_consultation" ON consultations
  FOR INSERT TO authenticated
  WITH CHECK (user_id::uuid = auth.uid() OR user_id IS NULL);

CREATE POLICY "authenticated_select_own_consultation" ON consultations
  FOR SELECT TO authenticated
  USING (user_id::uuid = auth.uid());

CREATE POLICY "facility_admin_view_consultations" ON consultations
  FOR SELECT TO authenticated
  USING (
    facility_id::text IN ( -- Cast facility_id to text
      SELECT facility_id::text FROM facility_admins WHERE user_id::uuid = auth.uid()
    )
  );

-- ============================================================
-- PRIORITY 3: FACILITY_REVIEWS
-- ============================================================

DROP POLICY IF EXISTS "Enable all for public" ON facility_reviews;
DROP POLICY IF EXISTS "Enable delete for public" ON facility_reviews;
DROP POLICY IF EXISTS "Enable update for public" ON facility_reviews;

CREATE POLICY "public_select_reviews" ON facility_reviews
  FOR SELECT TO public
  USING (true);

CREATE POLICY "authenticated_insert_own_review" ON facility_reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "owner_update_review" ON facility_reviews
  FOR UPDATE TO authenticated
  USING (user_id::uuid = auth.uid())
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "owner_delete_review" ON facility_reviews
  FOR DELETE TO authenticated
  USING (user_id::uuid = auth.uid());

-- ============================================================
-- PRIORITY 4: BACKUP TABLES (Remove user access)
-- ============================================================

DO $$ 
BEGIN
  -- Batch execute backups to avoid verbose output
  -- facilities_backup_20260119
  DROP POLICY IF EXISTS "Enable all for super admin" ON facilities_backup_20260119;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_only_backup' AND tablename = 'facilities_backup_20260119') THEN
    CREATE POLICY "service_role_only_backup" ON facilities_backup_20260119 FOR ALL TO service_role USING (true);
  END IF;

  -- facilities_backup_20260122
  DROP POLICY IF EXISTS "Enable all for super admin" ON facilities_backup_20260122;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_only_backup' AND tablename = 'facilities_backup_20260122') THEN
    CREATE POLICY "service_role_only_backup" ON facilities_backup_20260122 FOR ALL TO service_role USING (true);
  END IF;

  -- facilities_backup_v4
  DROP POLICY IF EXISTS "Enable all for super admin" ON facilities_backup_v4;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_only_backup' AND tablename = 'facilities_backup_v4') THEN
    CREATE POLICY "service_role_only_backup" ON facilities_backup_v4 FOR ALL TO service_role USING (true);
  END IF;
  
  -- broken_images_backup_20260119
  DROP POLICY IF EXISTS "Enable all for super admin" ON broken_images_backup_20260119;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_only_backup' AND tablename = 'broken_images_backup_20260119') THEN
    CREATE POLICY "service_role_only_backup" ON broken_images_backup_20260119 FOR ALL TO service_role USING (true);
  END IF;

  -- columbarium_backup_20260119
  DROP POLICY IF EXISTS "Enable all for super admin" ON columbarium_backup_20260119;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_only_backup' AND tablename = 'columbarium_backup_20260119') THEN
    CREATE POLICY "service_role_only_backup" ON columbarium_backup_20260119 FOR ALL TO service_role USING (true);
  END IF;

  -- facility_subscriptions_backup
  DROP POLICY IF EXISTS "Enable all for super admin" ON facility_subscriptions_backup;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_only_backup' AND tablename = 'facility_subscriptions_backup') THEN
    CREATE POLICY "service_role_only_backup" ON facility_subscriptions_backup FOR ALL TO service_role USING (true);
  END IF;

  -- memorial_spaces_backup_20251223
  DROP POLICY IF EXISTS "Enable all for super admin" ON memorial_spaces_backup_20251223;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_only_backup' AND tablename = 'memorial_spaces_backup_20251223') THEN
    CREATE POLICY "service_role_only_backup" ON memorial_spaces_backup_20251223 FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================================
-- PRIORITY 5: SUPER_ADMINS
-- ============================================================

DROP POLICY IF EXISTS "Enable read access for all" ON super_admins;
DROP POLICY IF EXISTS "Public can view super admins" ON super_admins;

CREATE POLICY "check_own_admin_status" ON super_admins
  FOR SELECT TO authenticated
  USING (user_id::uuid = auth.uid());

-- ============================================================
-- PRIORITY 6: ADMIN TABLES
-- ============================================================

-- admin_users
DROP POLICY IF EXISTS "Enable all for authenticated" ON admin_users;
CREATE POLICY "admin_select_own" ON admin_users
  FOR SELECT TO authenticated
  USING (user_id::uuid = auth.uid());

-- facility_admins
DROP POLICY IF EXISTS "Enable all for facility admins" ON facility_admins;
CREATE POLICY "facility_admin_select_own" ON facility_admins
  FOR SELECT TO authenticated
  USING (user_id::uuid = auth.uid());

-- sangjo_hq_admins
DROP POLICY IF EXISTS "Enable all for sangjo admins" ON sangjo_hq_admins;
CREATE POLICY "sangjo_admin_select_own" ON sangjo_hq_admins
  FOR SELECT TO authenticated
  USING (user_id::uuid = auth.uid());
