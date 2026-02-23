-- ============================================
-- CRITICAL: auth.uid() → clerk_user_id() RLS 정책 일괄 수정
-- Clerk ID는 UUID가 아님 → auth.uid() 사용 시 22P02 에러 발생
-- 29개 정책 / 16개 테이블
-- Date: 2026-02-19
-- ============================================

BEGIN;

-- ────────────────────────────────────────────
-- 1. user_notifications (3 policies → 2)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own notifications (is_read)" ON user_notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON user_notifications;

CREATE POLICY "notifications_select_own" ON user_notifications
  FOR SELECT USING (public.clerk_user_id() = user_id);

CREATE POLICY "notifications_update_own" ON user_notifications
  FOR UPDATE USING (public.clerk_user_id() = user_id)
  WITH CHECK (public.clerk_user_id() = user_id);

-- ────────────────────────────────────────────
-- 2. leads (2 policies → 2)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users view own leads" ON leads;
DROP POLICY IF EXISTS "leads_insert_owner_only" ON leads;

CREATE POLICY "leads_select_own" ON leads
  FOR SELECT USING (public.clerk_user_id() = user_id);

CREATE POLICY "leads_insert_own" ON leads
  FOR INSERT WITH CHECK (public.clerk_user_id() = user_id);

-- ────────────────────────────────────────────
-- 3. reviews_old (2 policies → 2)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews_old;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews_old;

CREATE POLICY "reviews_old_insert_own" ON reviews_old
  FOR INSERT WITH CHECK (
    user_id IS NOT NULL
    AND facility_id IS NOT NULL
    AND public.clerk_user_id() = user_id
  );

CREATE POLICY "reviews_old_delete_own" ON reviews_old
  FOR DELETE USING (public.clerk_user_id() = user_id);

-- ────────────────────────────────────────────
-- 4. admin_notifications (1 policy → 1)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own notifications" ON admin_notifications;

CREATE POLICY "admin_notifications_select_own" ON admin_notifications
  FOR SELECT USING (public.clerk_user_id() = user_id);

-- ────────────────────────────────────────────
-- 5. user_favorites (2 policies → 1)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON user_favorites;

CREATE POLICY "favorites_all_own" ON user_favorites
  FOR ALL USING (public.clerk_user_id() = user_id)
  WITH CHECK (public.clerk_user_id() = user_id);

-- ────────────────────────────────────────────
-- 6. reviews (2 policies → 2)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK (
    user_id IS NOT NULL
    AND facility_id IS NOT NULL
    AND public.clerk_user_id() = user_id
  );

CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE USING (public.clerk_user_id() = user_id);

-- ────────────────────────────────────────────
-- 7. user_journey_events (3 policies → 3)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own journey events" ON user_journey_events;
DROP POLICY IF EXISTS "Users can insert own journey events" ON user_journey_events;
DROP POLICY IF EXISTS "Users can delete own journey events" ON user_journey_events;

CREATE POLICY "journey_events_select_own" ON user_journey_events
  FOR SELECT USING (public.clerk_user_id() = user_id);

CREATE POLICY "journey_events_insert_own" ON user_journey_events
  FOR INSERT WITH CHECK (public.clerk_user_id() = user_id);

CREATE POLICY "journey_events_delete_own" ON user_journey_events
  FOR DELETE USING (public.clerk_user_id() = user_id);

-- ────────────────────────────────────────────
-- 8. subscription_payments (2 policies → 1)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert payments for their subscriptions" ON subscription_payments;
DROP POLICY IF EXISTS "Service role or owner can insert payments" ON subscription_payments;

CREATE POLICY "payments_insert_service_or_owner" ON subscription_payments
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR EXISTS (
      SELECT 1 FROM facility_subscriptions fs
      JOIN facilities f ON fs.facility_id = f.id
      WHERE fs.id = subscription_id
        AND f.user_id = public.clerk_user_id()
    )
  );

-- ────────────────────────────────────────────
-- 9. facility_reviews (5 policies → 3)
-- 중복 정책 통합 + auth.uid() 제거
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON facility_reviews;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON facility_reviews;
DROP POLICY IF EXISTS "authenticated_insert_own_review" ON facility_reviews;
DROP POLICY IF EXISTS "owner_update_review" ON facility_reviews;
DROP POLICY IF EXISTS "owner_delete_review" ON facility_reviews;

CREATE POLICY "facility_reviews_insert_own" ON facility_reviews
  FOR INSERT WITH CHECK (public.clerk_user_id() = user_id);

CREATE POLICY "facility_reviews_update_own_or_admin" ON facility_reviews
  FOR UPDATE USING (
    public.clerk_user_id() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_id = public.clerk_user_id()
        AND profiles.role IN ('admin', 'super_admin', 'partner')
    )
  );

CREATE POLICY "facility_reviews_delete_own_or_admin" ON facility_reviews
  FOR DELETE USING (
    public.clerk_user_id() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_id = public.clerk_user_id()
        AND profiles.role IN ('admin', 'super_admin', 'partner')
    )
  );

-- ────────────────────────────────────────────
-- 10. bot_data (1 policy → 1)
-- admin 확인을 profiles 테이블 기반으로 변경
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can do everything on bot_data" ON bot_data;

CREATE POLICY "bot_data_admin_all" ON bot_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_id = public.clerk_user_id()
        AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_id = public.clerk_user_id()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ────────────────────────────────────────────
-- 11. rls_test (1 policy → 1)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_test_insert_policy" ON rls_test;

CREATE POLICY "rls_test_insert_own" ON rls_test
  FOR INSERT WITH CHECK (public.clerk_user_id() = user_id);

-- ────────────────────────────────────────────
-- 12. chat_events (1 policy → 1)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "chat_events_insert_owner_only" ON chat_events;

CREATE POLICY "chat_events_insert_own" ON chat_events
  FOR INSERT WITH CHECK (public.clerk_user_id() = user_id);

-- ────────────────────────────────────────────
-- 13. emergency_requests (1 policy → 1)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "emergency_requests_insert_auth_only" ON emergency_requests;

CREATE POLICY "emergency_requests_insert_authenticated" ON emergency_requests
  FOR INSERT WITH CHECK (public.clerk_user_id() IS NOT NULL);

-- ────────────────────────────────────────────
-- 14. product_click_logs (1 policy → 1)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "product_click_logs_insert_owner_only" ON product_click_logs;

CREATE POLICY "product_click_logs_insert_own" ON product_click_logs
  FOR INSERT WITH CHECK (public.clerk_user_id() = user_id);

-- ────────────────────────────────────────────
-- 15. system_logs (1 policy → 1)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "system_logs_insert_auth_only" ON system_logs;

CREATE POLICY "system_logs_insert_authenticated" ON system_logs
  FOR INSERT WITH CHECK (public.clerk_user_id() IS NOT NULL);

-- ────────────────────────────────────────────
-- 16. super_admins (1 policy → 1)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "check_own_admin_status" ON super_admins;

CREATE POLICY "super_admins_select_own" ON super_admins
  FOR SELECT USING (public.clerk_user_id() = user_id);

COMMIT;

-- ────────────────────────────────────────────
-- 검증: auth.uid() 정책이 0건이어야 함
-- ────────────────────────────────────────────
SELECT '잔존 auth.uid() 정책' AS check_name, COUNT(*) AS remaining
FROM pg_policies
WHERE qual::text LIKE '%auth.uid()%'
   OR (with_check IS NOT NULL AND with_check::text LIKE '%auth.uid()%');
