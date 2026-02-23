-- ============================================
-- FIX v2: 타입 불일치 수정 (섹션 5,7,8,9,10,11,12,14)
-- 문제1: user_id UUID 컬럼 → profiles 서브쿼리로 매핑
-- 문제2: user_role enum → ::text 캐스트로 우회
-- 문제3: subscription_id bigint → 안전한 소유권 확인
-- Date: 2026-02-19
-- ============================================

-- ────────────────────────────────────────────
-- 5. user_favorites (user_id: UUID)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "favorites_all_own" ON user_favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON user_favorites;

CREATE POLICY "favorites_all_own" ON user_favorites
  FOR ALL
  USING (user_id = (SELECT p.id FROM profiles p WHERE p.clerk_id = public.clerk_user_id() LIMIT 1))
  WITH CHECK (user_id = (SELECT p.id FROM profiles p WHERE p.clerk_id = public.clerk_user_id() LIMIT 1));

-- ────────────────────────────────────────────
-- 7. user_journey_events (user_id: UUID)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "journey_events_select_own" ON user_journey_events;
DROP POLICY IF EXISTS "journey_events_insert_own" ON user_journey_events;
DROP POLICY IF EXISTS "journey_events_delete_own" ON user_journey_events;
DROP POLICY IF EXISTS "Users can view own journey events" ON user_journey_events;
DROP POLICY IF EXISTS "Users can insert own journey events" ON user_journey_events;
DROP POLICY IF EXISTS "Users can delete own journey events" ON user_journey_events;

CREATE POLICY "journey_events_select_own" ON user_journey_events
  FOR SELECT
  USING (user_id = (SELECT p.id FROM profiles p WHERE p.clerk_id = public.clerk_user_id() LIMIT 1));

CREATE POLICY "journey_events_insert_own" ON user_journey_events
  FOR INSERT
  WITH CHECK (user_id = (SELECT p.id FROM profiles p WHERE p.clerk_id = public.clerk_user_id() LIMIT 1));

CREATE POLICY "journey_events_delete_own" ON user_journey_events
  FOR DELETE
  USING (user_id = (SELECT p.id FROM profiles p WHERE p.clerk_id = public.clerk_user_id() LIMIT 1));

-- ────────────────────────────────────────────
-- 8. subscription_payments (subscription_id: bigint)
-- facility_subscriptions.id는 UUID → 직접 비교 불가
-- 서비스 역할 또는 시설 소유자만 허용
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_insert_service_or_owner" ON subscription_payments;
DROP POLICY IF EXISTS "Users can insert payments for their subscriptions" ON subscription_payments;
DROP POLICY IF EXISTS "Service role or owner can insert payments" ON subscription_payments;

CREATE POLICY "payments_insert_service_or_owner" ON subscription_payments
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.user_id = public.clerk_user_id()
    )
  );

-- ────────────────────────────────────────────
-- 9. facility_reviews (user_role enum 수정)
-- user_id는 TEXT → clerk_user_id() 직접 비교 OK
-- profiles.role은 user_role enum → ::text 캐스트
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "facility_reviews_insert_own" ON facility_reviews;
DROP POLICY IF EXISTS "facility_reviews_update_own_or_admin" ON facility_reviews;
DROP POLICY IF EXISTS "facility_reviews_delete_own_or_admin" ON facility_reviews;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON facility_reviews;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON facility_reviews;
DROP POLICY IF EXISTS "authenticated_insert_own_review" ON facility_reviews;
DROP POLICY IF EXISTS "owner_update_review" ON facility_reviews;
DROP POLICY IF EXISTS "owner_delete_review" ON facility_reviews;

CREATE POLICY "facility_reviews_insert_own" ON facility_reviews
  FOR INSERT
  WITH CHECK (public.clerk_user_id() = user_id);

CREATE POLICY "facility_reviews_update_own_or_admin" ON facility_reviews
  FOR UPDATE
  USING (
    public.clerk_user_id() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_id = public.clerk_user_id()
        AND profiles.role::text IN ('super_admin', 'partner')
    )
  );

CREATE POLICY "facility_reviews_delete_own_or_admin" ON facility_reviews
  FOR DELETE
  USING (
    public.clerk_user_id() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_id = public.clerk_user_id()
        AND profiles.role::text IN ('super_admin', 'partner')
    )
  );

-- ────────────────────────────────────────────
-- 10. bot_data (user_role enum 수정)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "bot_data_admin_all" ON bot_data;
DROP POLICY IF EXISTS "Admins can do everything on bot_data" ON bot_data;

CREATE POLICY "bot_data_admin_all" ON bot_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_id = public.clerk_user_id()
        AND profiles.role::text IN ('super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_id = public.clerk_user_id()
        AND profiles.role::text IN ('super_admin')
    )
  );

-- ────────────────────────────────────────────
-- 11. rls_test (user_id: UUID)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "rls_test_insert_own" ON rls_test;
DROP POLICY IF EXISTS "rls_test_insert_policy" ON rls_test;

CREATE POLICY "rls_test_insert_own" ON rls_test
  FOR INSERT
  WITH CHECK (user_id = (SELECT p.id FROM profiles p WHERE p.clerk_id = public.clerk_user_id() LIMIT 1));

-- ────────────────────────────────────────────
-- 12. chat_events (user_id: UUID)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "chat_events_insert_own" ON chat_events;
DROP POLICY IF EXISTS "chat_events_insert_owner_only" ON chat_events;

CREATE POLICY "chat_events_insert_own" ON chat_events
  FOR INSERT
  WITH CHECK (user_id = (SELECT p.id FROM profiles p WHERE p.clerk_id = public.clerk_user_id() LIMIT 1));

-- ────────────────────────────────────────────
-- 14. product_click_logs (user_id: UUID)
-- ────────────────────────────────────────────
DROP POLICY IF EXISTS "product_click_logs_insert_own" ON product_click_logs;
DROP POLICY IF EXISTS "product_click_logs_insert_owner_only" ON product_click_logs;

CREATE POLICY "product_click_logs_insert_own" ON product_click_logs
  FOR INSERT
  WITH CHECK (user_id = (SELECT p.id FROM profiles p WHERE p.clerk_id = public.clerk_user_id() LIMIT 1));

-- ────────────────────────────────────────────
-- 검증: auth.uid() 정책이 0건이어야 함
-- ────────────────────────────────────────────
SELECT '잔존 auth.uid() 정책' AS check_name, COUNT(*) AS remaining
FROM pg_policies
WHERE qual::text LIKE '%auth.uid()%'
   OR (with_check IS NOT NULL AND with_check::text LIKE '%auth.uid()%');
