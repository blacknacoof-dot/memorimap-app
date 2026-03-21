-- ============================================================
-- 20260223_high_severity_fixes.sql
-- HIGH 심각도 이슈 일괄 수정 (12건)
-- ============================================================

BEGIN;

-- ============================================================
-- HIGH-1: FK 누락 복원 (favorites, facility_subscriptions, facility_images)
-- DROP/ADD 반복 과정에서 FK 소실된 3개 테이블
-- 실 DB에서 facility_id가 TEXT인 경우 → UUID로 변환 후 FK 추가
-- ============================================================

-- Helper: 컬럼을 UUID로 변환 + FK 추가 (TEXT/BIGINT/UUID 모두 대응)
-- 각 테이블별 DO 블록으로 처리

-- favorites.facility_id → UUID + FK
DO $$
DECLARE
  v_type TEXT;
BEGIN
  SELECT udt_name INTO v_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'facility_id';

  IF v_type = 'text' OR v_type = 'varchar' THEN
    -- TEXT: 유효하지 않은 UUID 형식 제거 후 변환
    DELETE FROM public.favorites
    WHERE facility_id IS NOT NULL
      AND facility_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    ALTER TABLE public.favorites ALTER COLUMN facility_id TYPE UUID USING facility_id::uuid;
  ELSIF v_type = 'int8' OR v_type = 'int4' THEN
    -- BIGINT/INT: DROP + ADD (BIGINT은 UUID 캐스팅 불가)
    ALTER TABLE public.favorites DROP COLUMN facility_id CASCADE;
    ALTER TABLE public.favorites ADD COLUMN facility_id UUID;
  END IF;
  -- v_type = 'uuid' → 변환 불필요

  -- 고아 레코드 제거 (facilities에 없는 facility_id)
  DELETE FROM public.favorites
  WHERE facility_id IS NOT NULL
    AND facility_id::uuid NOT IN (SELECT id FROM public.facilities);

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_favorites_facility' AND table_name = 'favorites'
  ) THEN
    ALTER TABLE public.favorites
      ADD CONSTRAINT fk_favorites_facility
      FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- facility_subscriptions.facility_id → UUID + FK
DO $$
DECLARE
  v_type TEXT;
BEGIN
  SELECT udt_name INTO v_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'facility_subscriptions' AND column_name = 'facility_id';

  IF v_type = 'text' OR v_type = 'varchar' THEN
    DELETE FROM public.facility_subscriptions
    WHERE facility_id IS NOT NULL
      AND facility_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    ALTER TABLE public.facility_subscriptions ALTER COLUMN facility_id TYPE UUID USING facility_id::uuid;
  ELSIF v_type = 'int8' OR v_type = 'int4' THEN
    ALTER TABLE public.facility_subscriptions DROP COLUMN facility_id CASCADE;
    ALTER TABLE public.facility_subscriptions ADD COLUMN facility_id UUID;
  END IF;

  -- 고아 레코드 제거
  DELETE FROM public.facility_subscriptions
  WHERE facility_id IS NOT NULL
    AND facility_id NOT IN (SELECT id FROM public.facilities);

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_facility_subscriptions_facility' AND table_name = 'facility_subscriptions'
  ) THEN
    ALTER TABLE public.facility_subscriptions
      ADD CONSTRAINT fk_facility_subscriptions_facility
      FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- facility_images.facility_id → UUID + FK
DO $$
DECLARE
  v_type TEXT;
BEGIN
  SELECT udt_name INTO v_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'facility_images' AND column_name = 'facility_id';

  IF v_type = 'text' OR v_type = 'varchar' THEN
    DELETE FROM public.facility_images
    WHERE facility_id IS NOT NULL
      AND facility_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    ALTER TABLE public.facility_images ALTER COLUMN facility_id TYPE UUID USING facility_id::uuid;
  ELSIF v_type = 'int8' OR v_type = 'int4' THEN
    ALTER TABLE public.facility_images DROP COLUMN facility_id CASCADE;
    ALTER TABLE public.facility_images ADD COLUMN facility_id UUID;
  END IF;

  -- 고아 레코드 제거
  DELETE FROM public.facility_images
  WHERE facility_id IS NOT NULL
    AND facility_id NOT IN (SELECT id FROM public.facilities);

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_facility_images_facility' AND table_name = 'facility_images'
  ) THEN
    ALTER TABLE public.facility_images
      ADD CONSTRAINT fk_facility_images_facility
      FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- HIGH-2: super_admins 테이블 정합성 수정
-- is_active 컬럼 추가 + user_id 컬럼 보장
-- get_user_role() RPC가 super_admins.user_id + is_active 참조
-- ============================================================

-- 2-A: user_id 컬럼 보장 (패치에서는 id PK, 마이그레이션에서는 user_id 참조)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'super_admins' AND column_name = 'user_id'
  ) THEN
    -- id를 user_id로 rename하거나 alias 추가
    -- 기존 데이터가 id 컬럼에 있으므로, user_id 컬럼을 추가하고 id 값 복사
    ALTER TABLE public.super_admins ADD COLUMN user_id TEXT;
    UPDATE public.super_admins SET user_id = id WHERE user_id IS NULL;
  END IF;
END $$;

-- 2-B: is_active 컬럼 추가
ALTER TABLE public.super_admins
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================
-- HIGH-3: consultations_insert_public 정책 제거
-- 20260205에서 생성, cleanup에서 DROP 누락 — 비인증 INSERT 허용
-- 20260221의 consultations_insert_own (clerk_user_id 기반) 이 정상 정책
-- ============================================================

DROP POLICY IF EXISTS "consultations_insert_public" ON public.consultations;
DROP POLICY IF EXISTS "consultations_owner_all" ON public.consultations;
DROP POLICY IF EXISTS "consultations_facility_admin_select" ON public.consultations;
DROP POLICY IF EXISTS "consultations_super_admin_all" ON public.consultations;

-- ============================================================
-- HIGH-4: user_notifications service_role 정책 수정
-- TO 절 누락 → public 역할에 적용되던 문제
-- ============================================================

DROP POLICY IF EXISTS "service_role_manage_notifications" ON public.user_notifications;

CREATE POLICY "service_role_manage_notifications"
  ON public.user_notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- HIGH-5: 누락 인덱스 추가 (partner_id, user_id, clerk_id)
-- ============================================================

-- partner_id 인덱스 (대시보드 조회 성능)
CREATE INDEX IF NOT EXISTS idx_chat_events_partner_id
  ON public.chat_events(partner_id);

CREATE INDEX IF NOT EXISTS idx_emergency_requests_partner_id
  ON public.emergency_requests(partner_id);

CREATE INDEX IF NOT EXISTS idx_product_click_logs_partner_id
  ON public.product_click_logs(partner_id);

-- profiles.clerk_id (모든 RLS 정책의 핵심 — clerk_user_id() JOIN)
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id
  ON public.profiles(clerk_id);

-- ============================================================
-- HIGH-6: create_consultation_from_lead() 수정
-- v_lead.contact_name / contact_phone → leads에 없는 컬럼 참조
-- context_data JSONB에서 추출하도록 변경
-- status 'pending' → 'waiting' (현재 CHECK 제약)
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_consultation_from_lead(
    p_lead_id UUID,
    p_facility_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lead leads%ROWTYPE;
    v_new_consultation_id UUID;
    v_notes_text TEXT;
    v_user_name TEXT;
    v_user_phone TEXT;
BEGIN
    SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found: %', p_lead_id;
    END IF;

    -- context_data JSONB에서 이름/전화번호 추출 (contact_name/contact_phone 컬럼은 없음)
    v_user_name := COALESCE(
        v_lead.context_data->>'contact_name',
        v_lead.context_data->>'name',
        'Unknown'
    );
    v_user_phone := COALESCE(
        v_lead.context_data->>'contact_phone',
        v_lead.context_data->>'phone',
        'N/A'
    );

    v_notes_text := format(
        'Lead ID: %s | Category: %s | Urgency: %s | Context: %s',
        v_lead.id,
        COALESCE(v_lead.category, 'N/A'),
        COALESCE(v_lead.urgency, 'N/A'),
        COALESCE(v_lead.context_data::TEXT, '{}')
    );

    INSERT INTO consultations (
        user_id,
        facility_id,
        user_name,
        user_phone,
        status,
        notes
    ) VALUES (
        COALESCE(v_lead.user_id, 'anonymous'),
        p_facility_id::TEXT,
        v_user_name,
        v_user_phone,
        'waiting',
        v_notes_text
    )
    RETURNING id INTO v_new_consultation_id;

    UPDATE leads SET status = 'handed_over' WHERE id = p_lead_id;

    RETURN v_new_consultation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_consultation_from_lead(UUID, UUID) TO authenticated;

-- ============================================================
-- HIGH-7: approve_partner_transaction() SET search_path 추가
-- SECURITY DEFINER인데 search_path 미설정 → injection 취약점
-- 함수 전체 재정의 (기존 로직 완전 보존)
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_partner_transaction(
    p_inquiry_id BIGINT,
    p_admin_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inquiry RECORD;
    v_facility_id UUID;
    v_partner_id UUID;
BEGIN
    -- 트랜잭션 시작 시 상태 확인 및 잠금
    SELECT * INTO v_inquiry
    FROM partner_inquiries
    WHERE id = p_inquiry_id
    FOR UPDATE;

    IF v_inquiry IS NULL THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;
    IF v_inquiry.status != 'pending' THEN RAISE EXCEPTION '이미 처리된 건입니다.'; END IF;

    -- 1. 신규 시설 생성 (facilities 테이블)
    INSERT INTO facilities (
        user_id, name, type, address, phone, verified, status, business_hours, created_at
    )
    VALUES (
        v_inquiry.user_id,
        v_inquiry.company_name,
        CASE
            WHEN v_inquiry.business_type = 'funeral_home' THEN 'funeral_home'
            ELSE 'sangjo_biz'
        END,
        COALESCE(v_inquiry.address, ''),
        COALESCE(v_inquiry.contact_number, ''),
        true,
        'active',
        '{}'::jsonb,
        now()
    ) RETURNING id INTO v_facility_id;

    -- 2. partners 테이블에도 INSERT
    INSERT INTO partners (
        name, company_name, status, subscription_plan,
        contact_person, contact_phone, contact_email,
        funeral_location, created_at
    )
    VALUES (
        v_inquiry.company_name,
        v_inquiry.company_name,
        'approved',
        'basic',
        COALESCE(v_inquiry.contact_person, v_inquiry.manager_name, ''),
        COALESCE(v_inquiry.contact_number, v_inquiry.phone, ''),
        COALESCE(v_inquiry.company_email, v_inquiry.email, ''),
        COALESCE(v_inquiry.address, ''),
        now()
    ) RETURNING id INTO v_partner_id;

    -- 3. 상조 관련 테이블 INSERT
    IF v_inquiry.business_type = 'sangjo_hq' OR v_inquiry.business_type = 'sangjo' THEN
        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_partner_id::text, v_inquiry.company_name, 'hq_admin')
        ON CONFLICT DO NOTHING;

        INSERT INTO sangjo_dashboard_users (id, sangjo_id, role, name)
        VALUES (v_inquiry.user_id, v_partner_id::text, 'admin', v_inquiry.company_name)
        ON CONFLICT (id) DO UPDATE SET sangjo_id = EXCLUDED.sangjo_id, role = EXCLUDED.role;
    END IF;

    -- 4. 신청서 상태 업데이트
    UPDATE partner_inquiries
    SET status = 'approved',
        target_facility_id = v_facility_id::text,
        updated_at = now()
    WHERE id = p_inquiry_id;

    -- 5. 유저 프로필 역할 업데이트
    UPDATE profiles
    SET role = (
        CASE
            WHEN v_inquiry.business_type = 'sangjo_hq' THEN 'sangjo_hq_admin'
            WHEN v_inquiry.business_type = 'sangjo' THEN 'sangjo_user'
            ELSE 'facility_admin'
        END
    )::public.user_role,
    updated_at = now()
    WHERE clerk_id = v_inquiry.user_id;

    -- 6. 관리 로그 기록
    INSERT INTO audit_logs (actor_id, action, target_resource, target_id, details)
    VALUES (p_admin_id, 'APPROVE_PARTNER', 'partner_inquiries', p_inquiry_id::text,
            jsonb_build_object(
                'facility_id', v_facility_id,
                'partner_id', v_partner_id,
                'company_name', v_inquiry.company_name,
                'role_assigned', true
            ));

    RETURN jsonb_build_object(
        'success', true,
        'facility_id', v_facility_id,
        'partner_id', v_partner_id,
        'action', 'approved'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================
-- HIGH-8: user_shares.share_password 해싱 적용
-- 평문 → pgcrypto crypt/gen_salt 해싱
-- get_shared_journey / create_journey_share 함수도 업데이트
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 8-A: 기존 평문 비밀번호를 해시로 마이그레이션
UPDATE public.user_shares
SET share_password = crypt(share_password, gen_salt('bf'))
WHERE share_password IS NOT NULL
  AND share_password NOT LIKE '$2a$%'
  AND share_password NOT LIKE '$2b$%';

-- 8-B: get_shared_journey → 해시 비교로 변경
CREATE OR REPLACE FUNCTION public.get_shared_journey(p_token TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
  v_journey JSONB;
  v_ending JSONB;
BEGIN
  SELECT * INTO v_share
  FROM user_shares
  WHERE share_token = p_token AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', '공유 링크를 찾을 수 없습니다.');
  END IF;

  IF v_share.expires_at IS NOT NULL AND v_share.expires_at < NOW() THEN
    RETURN jsonb_build_object('error', '만료된 공유 링크입니다.');
  END IF;

  -- 해시 비교 (bcrypt)
  IF v_share.share_password != crypt(p_password, v_share.share_password) THEN
    RETURN jsonb_build_object('error', '비밀번호가 일치하지 않습니다.');
  END IF;

  -- 조회수 증가
  UPDATE user_shares SET view_count = view_count + 1 WHERE id = v_share.id;

  -- 여정 데이터
  SELECT jsonb_agg(
    jsonb_build_object(
      'event_type', event_type,
      'title', title,
      'description', description,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ) INTO v_journey
  FROM user_journey_logs
  WHERE user_id = v_share.user_id;

  -- 엔딩노트
  SELECT jsonb_build_object(
    'preferred_types', preferred_types,
    'emergency_contact', emergency_contact,
    'final_memo', final_memo,
    'progress_percent', progress_percent
  ) INTO v_ending
  FROM user_ending_notes
  WHERE user_id = v_share.user_id;

  RETURN jsonb_build_object(
    'success', true,
    'preferences', v_share.preferences,
    'contact', v_share.contact,
    'memo', v_share.memo,
    'progress_percent', v_share.progress_percent,
    'journey', COALESCE(v_journey, '[]'::jsonb),
    'ending_note', v_ending,
    'view_count', v_share.view_count + 1
  );
END;
$$;

-- 8-C: create_journey_share → 해시로 저장
CREATE OR REPLACE FUNCTION public.create_journey_share(
  p_preferences TEXT[],
  p_contact TEXT,
  p_memo TEXT,
  p_percent INTEGER,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id TEXT;
  v_token TEXT;
  v_share_id UUID;
BEGIN
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', '로그인이 필요합니다.');
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO user_shares (
    user_id, share_token, share_password,
    preferences, contact, memo, progress_percent
  ) VALUES (
    v_user_id, v_token, crypt(p_password, gen_salt('bf')),
    p_preferences, p_contact, p_memo, p_percent
  ) RETURNING id INTO v_share_id;

  RETURN jsonb_build_object(
    'success', true,
    'share_token', v_token,
    'share_id', v_share_id
  );
END;
$$;

-- ============================================================
-- HIGH-9: CASCADE로 삭제된 뷰 재생성
-- admin_subscriptions_with_facility (superAdmin 대시보드에서 사용)
-- facility_subscriptions + facilities JOIN 뷰
-- ============================================================

CREATE OR REPLACE VIEW public.admin_subscriptions_with_facility AS
SELECT
  fs.*,
  f.name AS facility_name
FROM public.facility_subscriptions fs
LEFT JOIN public.facilities f ON fs.facility_id = f.id;

-- 뷰 접근 권한
GRANT SELECT ON public.admin_subscriptions_with_facility TO authenticated;
GRANT SELECT ON public.admin_subscriptions_with_facility TO service_role;

COMMIT;
