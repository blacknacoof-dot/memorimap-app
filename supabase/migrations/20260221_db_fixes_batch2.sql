-- =============================================
-- 20260221_db_fixes_batch2.sql
-- DB 감사 CRITICAL/HIGH 수정 (ISSUE-13, 14, 16, 17)
-- RLS 정책 의존성 → 정책 삭제 → 타입 변환 → 정책 재생성
-- =============================================

-- =============================================
-- ISSUE-13: leads.user_id UUID FK → TEXT 변환
-- =============================================
-- 1) 의존 RLS 정책 삭제
DROP POLICY IF EXISTS "leads_select_own" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_own" ON public.leads;
DROP POLICY IF EXISTS "leads_update_own" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_own" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.leads;

-- 2) FK 제거
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'leads' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'
  LOOP
    EXECUTE 'ALTER TABLE public.leads DROP CONSTRAINT ' || quote_ident(r.constraint_name);
  END LOOP;
END $$;

-- 3) 타입 변환
ALTER TABLE public.leads ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 4) RLS 재생성 (clerk_user_id 사용)
CREATE POLICY "leads_select_own" ON public.leads FOR SELECT
  USING (public.is_super_admin() OR public.clerk_user_id() = user_id);
CREATE POLICY "leads_insert_own" ON public.leads FOR INSERT
  WITH CHECK (public.clerk_user_id() = user_id);

-- =============================================
-- ISSUE-14: chat_events.user_id UUID FK → TEXT 변환
-- =============================================
DROP POLICY IF EXISTS "chat_events_select_own" ON public.chat_events;
DROP POLICY IF EXISTS "chat_events_insert_own" ON public.chat_events;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.chat_events;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.chat_events;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'chat_events' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'
  LOOP
    EXECUTE 'ALTER TABLE public.chat_events DROP CONSTRAINT ' || quote_ident(r.constraint_name);
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_events' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.chat_events ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;
END $$;

CREATE POLICY "chat_events_select_own" ON public.chat_events FOR SELECT
  USING (public.is_super_admin() OR public.clerk_user_id() = user_id);
CREATE POLICY "chat_events_insert_own" ON public.chat_events FOR INSERT
  WITH CHECK (public.clerk_user_id() = user_id);

-- =============================================
-- ISSUE-16: product_click_logs.user_id UUID FK → TEXT 변환
-- =============================================
DROP POLICY IF EXISTS "product_click_logs_select" ON public.product_click_logs;
DROP POLICY IF EXISTS "product_click_logs_insert" ON public.product_click_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_click_logs;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.product_click_logs;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'product_click_logs' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'
  LOOP
    EXECUTE 'ALTER TABLE public.product_click_logs DROP CONSTRAINT ' || quote_ident(r.constraint_name);
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_click_logs' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.product_click_logs ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;
END $$;

CREATE POLICY "product_click_logs_select" ON public.product_click_logs FOR SELECT
  USING (public.is_super_admin() OR public.clerk_user_id() = user_id);
CREATE POLICY "product_click_logs_insert" ON public.product_click_logs FOR INSERT
  WITH CHECK (public.clerk_user_id() = user_id);

-- =============================================
-- ISSUE-17: sangjo_contracts RLS 강화
-- =============================================
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sangjo_contracts;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.sangjo_contracts;
DROP POLICY IF EXISTS "sangjo_contracts_select" ON public.sangjo_contracts;

CREATE POLICY "sangjo_contracts_select_restricted"
  ON public.sangjo_contracts FOR SELECT
  USING (
    public.is_super_admin()
    OR public.clerk_user_id() = sangjo_id
  );
