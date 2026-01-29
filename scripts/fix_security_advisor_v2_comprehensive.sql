-- ========================================================================
-- Safe Security Hardening v2 (Comprehensive WARN/INFO Fix)
-- - Signature-safe ALTER FUNCTION
-- - Policy name standardization (underscores)
-- - Type-cast safety for auth.jwt() comparisons
-- ========================================================================

BEGIN;

-- ========================================================================
-- Part 0: 현재 정책 백업 (임시 테이블)
-- ========================================================================
DROP TABLE IF EXISTS public._policy_backup;
CREATE TABLE public._policy_backup AS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- ========================================================================
-- PART 1: 안전한 ALTER FUNCTION (search_path 고정)
-- - 시그니처가 정확히 일치하는 함수들만 찾아 search_path 적용
-- ========================================================================
DO $$
DECLARE
  fn_name text;
  rec record;
  target_names text[] := ARRAY[
    'sync_user_role_to_sangjo',
    'search_facilities_v2',
    'update_updated_at_column',
    'create_default_timeline_events',
    'approve_partner_transaction',
    'is_super_admin',
    'approve_partner_and_grant_role',
    'update_funeral_progress_timestamp',
    'user_id',
    'search_facilities',
    'log_admin_action',
    'approve_facility_partner_rpc',
    'handle_new_user',
    'get_distinct_regions',
    'search_facilities_in_view',
    'clerk_user_id',
    'notify_webhook_on_notification',
    'get_current_user_id',
    'update_consultations_updated_at',
    'search_facilities_by_text',
    'update_timeline_and_notify',
    'current_user_id',
    'update_timestamp'
  ];
BEGIN
  FOR fn_name IN SELECT unnest(target_names)
  LOOP
    FOR rec IN
      SELECT p.oid, p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) AS identity_args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = fn_name
    LOOP
      BEGIN
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', rec.proname, rec.identity_args);
        RAISE NOTICE 'ALTER FUNCTION applied: % ( % )', rec.proname, rec.identity_args;
      EXCEPTION WHEN others THEN
        RAISE WARNING 'Failed to ALTER FUNCTION public.% due to: %', rec.proname, SQLERRM;
      END;
    END LOOP;
  END LOOP;
END $$;

-- ========================================================================
-- PART 2: RLS 정책 정교화 (Always True 방지)
-- ========================================================================

-- [2-1. profiles]
DROP POLICY IF EXISTS users_can_insert_their_own_profile ON public.profiles;
DROP POLICY IF EXISTS users_can_update_own_profile ON public.profiles;

CREATE POLICY users_can_insert_their_own_profile
  ON public.profiles
  FOR INSERT
  WITH CHECK (id::text = (auth.jwt() ->> 'sub'));

CREATE POLICY users_can_update_own_profile
  ON public.profiles
  FOR UPDATE
  USING (id::text = (auth.jwt() ->> 'sub'))
  WITH CHECK (id::text = (auth.jwt() ->> 'sub'));

-- [2-2. facility_subscriptions]
DROP POLICY IF EXISTS manage_own_subscriptions_or_admin ON public.facility_subscriptions;
CREATE POLICY manage_own_subscriptions_or_admin
  ON public.facility_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id::text = public.facility_subscriptions.facility_id_uuid::text
        AND f.user_id::text = (auth.jwt() ->> 'sub')
    )
  );

-- [2-3. funeral_companies]
DROP POLICY IF EXISTS admin_only_upsert_funeral_companies ON public.funeral_companies;
CREATE POLICY admin_only_upsert_funeral_companies
  ON public.funeral_companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
        AND p.role::text IN ('super_admin', 'sangjo_manager')
    )
  );

-- ========================================================================
-- PART 3: 누락된 RLS 정책 보완 (Super Admin 전용)
-- ========================================================================
DO $$
DECLARE
    t text;
    target_tables text[] := ARRAY[
        'admin_users', 'ai_consultations', 'facility_admins', 'facility_faqs',
        'facility_images', 'faq_view_logs', 'funeral_contracts', 'funeral_progress',
        'memorial_consultations', 'notices', 'partner_operations', 'payments',
        'platform_notices', 'review_helpful_logs', 'sangjo_contract_timeline',
        'sangjo_contracts', 'sangjo_dashboard_users', 'sms_logs', 'sms_templates',
        'subscription_history', 'subscription_plans', 'subscriptions', 'user_likes'
    ];
BEGIN
    FOREACH t IN ARRAY target_tables LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', ('super_admin_manage_' || t), t);
            EXECUTE format($fmt$
                CREATE POLICY %I ON public.%I
                FOR ALL
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1 FROM public.profiles p
                        WHERE (p.clerk_id::text = (auth.jwt() ->> 'sub') OR p.id::text = (auth.jwt() ->> 'sub'))
                          AND p.role::text = 'super_admin'
                    )
                );
            $fmt$, ('super_admin_manage_' || t), t);
        END IF;
    END LOOP;
END $$;

-- ========================================================================
-- PART 4: PUBLIC 역할로부터 모든 기본 권한 회수 (권장)
-- ========================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
-- [참고] 이후 필요한 경우 authenticated 및 anon 역할에 대해 GRANT SELECT 등 필요할 수 있음

COMMIT;

SELECT schemaname, tablename, policyname, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

DO $$ 
BEGIN
    RAISE NOTICE '✅ WARN/INFO 레벨 보안 하드닝 v2.0 적용 완료';
END $$;
