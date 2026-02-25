-- ============================================================
-- 20260225_unified_audit_fix.sql
-- DB 레이어 통합 정비: 감사 결과 27건 이슈 수정
-- ============================================================

-- 1A. leads — contact_name, contact_phone 컬럼 추가 (CRITICAL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN contact_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN contact_phone TEXT;
  END IF;
END $$;

-- 1B. consultations — CHECK 제약에 'pending' 추가 (CRITICAL)
-- 기존 CHECK 제거 후 재생성 (pending 포함)
DO $$
DECLARE
  v_constraint_name TEXT;
BEGIN
  -- status CHECK 제약 찾기
  SELECT con.conname INTO v_constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'consultations'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%status%'
  LIMIT 1;

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.consultations DROP CONSTRAINT %I', v_constraint_name);
  END IF;

  -- pending 포함된 새 CHECK 추가
  ALTER TABLE public.consultations
    ADD CONSTRAINT consultations_status_check
    CHECK (status IN ('pending', 'waiting', 'accepted', 'cancelled', 'completed'));
END $$;

-- 1C. sangjo_users — 테이블 없으면 생성 + RLS + 인덱스 (HIGH)
CREATE TABLE IF NOT EXISTS public.sangjo_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  sangjo_id TEXT NOT NULL,
  role TEXT DEFAULT 'branch_admin',
  branch_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.sangjo_users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 있으면 삭제 후 재생성
DROP POLICY IF EXISTS "sangjo_users_select_own" ON public.sangjo_users;
CREATE POLICY "sangjo_users_select_own" ON public.sangjo_users
  FOR SELECT TO authenticated
  USING (
    user_id = public.clerk_user_id()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "sangjo_users_insert_admin" ON public.sangjo_users;
CREATE POLICY "sangjo_users_insert_admin" ON public.sangjo_users
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "sangjo_users_update_admin" ON public.sangjo_users;
CREATE POLICY "sangjo_users_update_admin" ON public.sangjo_users
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "sangjo_users_delete_admin" ON public.sangjo_users;
CREATE POLICY "sangjo_users_delete_admin" ON public.sangjo_users
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sangjo_users_user_id ON public.sangjo_users(user_id);
CREATE INDEX IF NOT EXISTS idx_sangjo_users_sangjo_id ON public.sangjo_users(sangjo_id);

-- 1D. partner_inquiries — 하드코딩 이메일 RLS 제거 → is_super_admin() (HIGH)
-- 하드코딩 이메일이 포함된 정책 제거
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_inquiries'
      AND (qual LIKE '%blacknacoof%' OR qual LIKE '%gmail.com%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.partner_inquiries', pol.policyname);
  END LOOP;
END $$;

-- partner_inquiries RLS 재설정
DROP POLICY IF EXISTS "partner_inquiries_select" ON public.partner_inquiries;
CREATE POLICY "partner_inquiries_select" ON public.partner_inquiries
  FOR SELECT TO authenticated
  USING (
    user_id = public.clerk_user_id()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "partner_inquiries_insert" ON public.partner_inquiries;
CREATE POLICY "partner_inquiries_insert" ON public.partner_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.clerk_user_id());

DROP POLICY IF EXISTS "partner_inquiries_update_admin" ON public.partner_inquiries;
CREATE POLICY "partner_inquiries_update_admin" ON public.partner_inquiries
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 1E. leads — public.users 참조 RLS 제거 → is_super_admin() (HIGH)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'leads'
      AND (qual LIKE '%public.users%' OR qual LIKE '%blacknacoof%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', pol.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "leads_select" ON public.leads;
CREATE POLICY "leads_select" ON public.leads
  FOR SELECT TO authenticated
  USING (
    user_id = public.clerk_user_id()
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id::text = leads.facility_id::text
        AND f.user_id = public.clerk_user_id()
    )
  );

DROP POLICY IF EXISTS "leads_insert" ON public.leads;
CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "leads_update_admin" ON public.leads;
CREATE POLICY "leads_update_admin" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.facilities f
      WHERE f.id::text = leads.facility_id::text
        AND f.user_id = public.clerk_user_id()
    )
  );

-- 1F. platform_notices RLS 보강
-- platform_notices 테이블이 이미 존재 → 코드를 platform_notices로 통일 완료
ALTER TABLE public.platform_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_notices_select_public" ON public.platform_notices;
CREATE POLICY "platform_notices_select_public" ON public.platform_notices
  FOR SELECT TO authenticated
  USING (is_active = true OR public.is_super_admin());

DROP POLICY IF EXISTS "platform_notices_insert_admin" ON public.platform_notices;
CREATE POLICY "platform_notices_insert_admin" ON public.platform_notices
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "platform_notices_update_admin" ON public.platform_notices;
CREATE POLICY "platform_notices_update_admin" ON public.platform_notices
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "platform_notices_delete_admin" ON public.platform_notices;
CREATE POLICY "platform_notices_delete_admin" ON public.platform_notices
  FOR DELETE TO authenticated
  USING (public.is_super_admin());
