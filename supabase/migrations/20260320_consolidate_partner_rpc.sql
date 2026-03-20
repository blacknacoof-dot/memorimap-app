-- ============================================================
-- 20260320_consolidate_partner_rpc.sql
-- 파트너 승인/거절 RPC 통합 (4개 마이그레이션 → 최종 1개)
-- ============================================================
-- 통합 대상:
--   20260215_fix_approve_partner_e2e.sql      (M1)
--   20260223_high_severity_fixes.sql          (M2, HIGH-7 부분)
--   20260226_partner_rpc_atomic.sql           (M3)
--   20260301_sangjo_facilities_sync.sql       (M4, Step 2 부분)
--
-- 최종 버전 = M4 기반 + M2의 SET search_path 보완
-- 멱등성(idempotent): CREATE OR REPLACE → 여러 번 실행해도 안전
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. approve_partner_transaction (최종 통합 버전)
-- ─────────────────────────────────────────────
-- 변경 이력:
--   M1: 기본 구조 (facilities + partners + sangjo + profiles + audit)
--   M2: SET search_path = public 추가 (보안)
--   M3: 동일업체 자동거절(Step5) + 인앱알림(Step8) 추가, audit_logs 신컬럼
--   M4: sangjo_id = v_facility_id, facilities.type = 'sangjo'
--   통합: M4 전체 + M2의 search_path + M3의 reject RPC
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

    -- Step 1: 신규 시설 생성
    INSERT INTO facilities (
        user_id, name, type, address, phone, verified, status, business_hours, created_at
    )
    VALUES (
        v_inquiry.user_id,
        v_inquiry.company_name,
        CASE
            WHEN v_inquiry.business_type = 'funeral_home' THEN 'funeral_home'
            ELSE 'sangjo'
        END,
        COALESCE(v_inquiry.address, ''),
        COALESCE(v_inquiry.contact_number, ''),
        true,
        'active',
        '{}'::jsonb,
        now()
    ) RETURNING id INTO v_facility_id;

    -- Step 2: partners 테이블 INSERT
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

    -- Step 3: 상조 관련 테이블 (sangjo_id = v_facility_id — M4 핵심 수정)
    IF v_inquiry.business_type = 'sangjo_hq' OR v_inquiry.business_type = 'sangjo' THEN
        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_facility_id::text, v_inquiry.company_name, 'hq_admin')
        ON CONFLICT DO NOTHING;

        INSERT INTO sangjo_dashboard_users (id, sangjo_id, role, name)
        VALUES (v_inquiry.user_id, v_facility_id::text, 'admin', v_inquiry.company_name)
        ON CONFLICT (id) DO UPDATE SET sangjo_id = EXCLUDED.sangjo_id, role = EXCLUDED.role;
    END IF;

    -- Step 4: 신청서 상태 업데이트
    UPDATE partner_inquiries
    SET status = 'approved',
        target_facility_id = v_facility_id::text,
        updated_at = now()
    WHERE id = p_inquiry_id;

    -- Step 5: 동일 업체 다른 pending 신청 자동 거절 (M3에서 추가)
    UPDATE partner_inquiries
    SET status = 'rejected',
        message = '[System] 동일 업체 다른 신청이 승인되어 자동 반려됨.',
        updated_at = now()
    WHERE company_name = v_inquiry.company_name
      AND status = 'pending'
      AND id != p_inquiry_id;

    -- Step 6: 유저 프로필 역할 업데이트 (::public.user_role 캐스팅 필수)
    -- ★ 재발 방지: super_admin은 절대 덮어쓰지 않음
    UPDATE public.profiles
    SET role = (
        CASE
            WHEN v_inquiry.business_type = 'sangjo_hq' THEN 'sangjo_hq_admin'
            WHEN v_inquiry.business_type = 'sangjo' THEN 'sangjo_user'
            ELSE 'facility_admin'
        END
    )::public.user_role,
    updated_at = now()
    WHERE clerk_id = v_inquiry.user_id
      AND role != 'super_admin'::public.user_role;

    -- Step 7: 감사 로그 (신 컬럼: user_id, resource_type, resource_id, metadata)
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_admin_id, 'APPROVE_PARTNER', 'partner_inquiries', p_inquiry_id::text,
            jsonb_build_object(
                'action_category', 'ADMIN_ACTION',
                'facility_id', v_facility_id,
                'partner_id', v_partner_id,
                'company_name', v_inquiry.company_name,
                'role_assigned', true
            ));

    -- Step 8: 인앱 알림 (SECURITY DEFINER 내부이므로 RLS 우회, M3에서 추가)
    INSERT INTO user_notifications (user_id, title, message, type, link)
    VALUES (
        v_inquiry.user_id,
        '입점 신청 승인 완료',
        '축하합니다! ' || v_inquiry.company_name || '의 입점 신청이 승인되었습니다. 지금 바로 대시보드에서 시설 정보를 관리해보세요.',
        'success',
        '/dashboard'
    );

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

-- ─────────────────────────────────────────────
-- 2. reject_partner_transaction (M3에서 신규, search_path 보완)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_partner_transaction(
    p_inquiry_id BIGINT,
    p_admin_id TEXT,
    p_reason TEXT DEFAULT '운영팀 문의 요망'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inquiry RECORD;
    v_affected_count INT;
BEGIN
    -- 신청서 조회 및 잠금
    SELECT * INTO v_inquiry
    FROM partner_inquiries
    WHERE id = p_inquiry_id
    FOR UPDATE;

    IF v_inquiry IS NULL THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;
    IF v_inquiry.status != 'pending' THEN RAISE EXCEPTION '이미 처리된 건입니다.'; END IF;

    -- Step 1: 같은 회사의 모든 pending 신청 일괄 거절
    UPDATE partner_inquiries
    SET status = 'rejected',
        message = '[System] 반려 사유: ' || p_reason,
        updated_at = now()
    WHERE company_name = v_inquiry.company_name
      AND status = 'pending';

    GET DIAGNOSTICS v_affected_count = ROW_COUNT;

    -- Step 2: 감사 로그
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_admin_id, 'REJECT_PARTNER', 'partner_inquiries', p_inquiry_id::text,
            jsonb_build_object(
                'action_category', 'ADMIN_ACTION',
                'reason', p_reason,
                'bulk', true,
                'affected_count', v_affected_count,
                'company_name', v_inquiry.company_name
            ));

    -- Step 3: 인앱 알림 (SECURITY DEFINER 내부이므로 RLS 우회)
    INSERT INTO user_notifications (user_id, title, message, type)
    VALUES (
        v_inquiry.user_id,
        '입점 신청 반려 안내',
        '신청하신 ' || v_inquiry.company_name || '의 입점 신청이 반려되었습니다. 사유: ' || p_reason,
        'warning'
    );

    RETURN jsonb_build_object(
        'success', true,
        'action', 'rejected',
        'affected_count', v_affected_count,
        'company_name', v_inquiry.company_name
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ─────────────────────────────────────────────
-- 3. 요금제 레코드 보장 (M4에서 가져옴, ON CONFLICT DO NOTHING → 멱등)
-- ─────────────────────────────────────────────
INSERT INTO subscription_plans (name, name_en, price, sms_quota, ai_chat_quota, features)
VALUES
  ('무료체험', 'FREE', 0, 0, 0, '{"photos":3,"ai_chat":false,"sms":false,"stats":false,"badge":null,"priority":"normal"}'::jsonb),
  ('베이직', 'BASIC', 99000, 100, 100, '{"photos":-1,"ai_chat":true,"sms":true,"stats":"basic","badge":null,"priority":"normal"}'::jsonb),
  ('프리미엄', 'PREMIUM', 299000, -1, -1, '{"photos":-1,"ai_chat":true,"sms":true,"stats":"full","badge":"silver","priority":"high"}'::jsonb),
  ('엔터프라이즈', 'ENTERPRISE', 499000, -1, -1, '{"photos":-1,"ai_chat":true,"sms":true,"stats":"full","badge":"gold","priority":"top","api":true,"dedicated_manager":true}'::jsonb)
ON CONFLICT (name_en) DO NOTHING;

INSERT INTO subscription_plans (name, name_en, price, sms_quota, ai_chat_quota, features)
VALUES
  ('상조 STARTER', 'SJ_STARTER', 3000000, 0, -1, '{"ai_consult":true,"auto_closing":true,"coupon":"300000","report":"basic","priority":"normal"}'::jsonb),
  ('상조 PROFESSIONAL', 'SJ_PROFESSIONAL', 8000000, 0, -1, '{"ai_consult":true,"crm":"advanced","dashboard":"realtime","cs":"dedicated","report":"weekly","priority":"high"}'::jsonb),
  ('상조 ENTERPRISE', 'SJ_ENTERPRISE', 15000000, 0, -1, '{"ai_consult":true,"banner":"exclusive","auto_contract":true,"manager":"dedicated","custom_branding":true,"api":true,"report":"custom","priority":"top"}'::jsonb)
ON CONFLICT (name_en) DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. funeral_companies → facilities 동기화 (M4에서 가져옴, ON CONFLICT DO NOTHING → 멱등)
-- ─────────────────────────────────────────────
INSERT INTO facilities (
    id, user_id, name, type, address, phone,
    verified, status, business_hours, created_at
)
SELECT
    fc.id::uuid,
    'system_sangjo_import',
    fc.name,
    'sangjo',
    '',
    COALESCE(fc.phone, ''),
    true,
    'active',
    '{}'::jsonb,
    now()
FROM funeral_companies fc
WHERE fc.id IS NOT NULL
  AND fc.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 5. 검증 쿼리 (실행 결과 확인용)
-- ─────────────────────────────────────────────
DO $$
DECLARE
    v_approve_exists BOOLEAN;
    v_reject_exists BOOLEAN;
    v_sangjo_count INT;
    v_plan_count INT;
BEGIN
    -- RPC 존재 확인
    SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'approve_partner_transaction') INTO v_approve_exists;
    SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'reject_partner_transaction') INTO v_reject_exists;

    -- 동기화 결과
    SELECT count(*) INTO v_sangjo_count FROM facilities WHERE type = 'sangjo';
    SELECT count(*) INTO v_plan_count FROM subscription_plans;

    RAISE NOTICE '──────────────────────────────────';
    RAISE NOTICE '통합 마이그레이션 검증 결과:';
    RAISE NOTICE '  approve_partner_transaction: %', CASE WHEN v_approve_exists THEN 'OK' ELSE 'MISSING' END;
    RAISE NOTICE '  reject_partner_transaction: %', CASE WHEN v_reject_exists THEN 'OK' ELSE 'MISSING' END;
    RAISE NOTICE '  sangjo 시설: %건', v_sangjo_count;
    RAISE NOTICE '  요금제: %건', v_plan_count;
    RAISE NOTICE '──────────────────────────────────';
END $$;
