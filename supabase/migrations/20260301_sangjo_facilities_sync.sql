-- ============================================================
-- A안: funeral_companies → facilities 동기화 + RPC 수정
-- ============================================================
-- 근본 원인:
--   1) sangjo_hq_admins.sangjo_id = funeral_companies.id (UUID)
--   2) PartnerDashboard는 facilities 테이블을 조회
--   3) funeral_companies 레코드가 facilities에 없어서 데이터 불일치
-- 해결: funeral_companies를 facilities에 동일 UUID로 삽입 + RPC 수정
-- ============================================================

-- ─────────────────────────────────────────────
-- Step 1: funeral_companies → facilities 동기화
-- ─────────────────────────────────────────────
-- 동일 UUID를 사용하여 sangjo_hq_admins.sangjo_id가 facilities.id와 일치하도록 함
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
-- Step 2: approve_partner_transaction RPC 수정
-- ─────────────────────────────────────────────
-- 변경점: sangjo_hq_admins.sangjo_id를 v_partner_id 대신 v_facility_id로 저장
-- 이유: PartnerDashboard가 facilities.id 기준으로 조회하므로 일치 필요
CREATE OR REPLACE FUNCTION public.approve_partner_transaction(
    p_inquiry_id BIGINT,
    p_admin_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

    -- 1. 신규 시설 생성
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

    -- 2. partners 테이블 INSERT
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

    -- 3. 상조 관련 테이블 — ★ 핵심 수정: v_partner_id → v_facility_id
    IF v_inquiry.business_type = 'sangjo_hq' OR v_inquiry.business_type = 'sangjo' THEN
        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_facility_id::text, v_inquiry.company_name, 'hq_admin')
        ON CONFLICT DO NOTHING;

        INSERT INTO sangjo_dashboard_users (id, sangjo_id, role, name)
        VALUES (v_inquiry.user_id, v_facility_id::text, 'admin', v_inquiry.company_name)
        ON CONFLICT (id) DO UPDATE SET sangjo_id = EXCLUDED.sangjo_id, role = EXCLUDED.role;
    END IF;

    -- 4. 신청서 상태 업데이트
    UPDATE partner_inquiries
    SET status = 'approved',
        target_facility_id = v_facility_id::text,
        updated_at = now()
    WHERE id = p_inquiry_id;

    -- 5. 동일 업체 다른 pending 신청 자동 거절
    UPDATE partner_inquiries
    SET status = 'rejected',
        message = '[System] 동일 업체 다른 신청이 승인되어 자동 반려됨.',
        updated_at = now()
    WHERE company_name = v_inquiry.company_name
      AND status = 'pending'
      AND id != p_inquiry_id;

    -- 6. 유저 프로필 역할 업데이트
    UPDATE public.profiles
    SET role = (
        CASE
            WHEN v_inquiry.business_type = 'sangjo_hq' THEN 'sangjo_hq_admin'
            WHEN v_inquiry.business_type = 'sangjo' THEN 'sangjo_user'
            ELSE 'facility_admin'
        END
    )::public.user_role,
    updated_at = now()
    WHERE clerk_id = v_inquiry.user_id;

    -- 7. 감사 로그
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_admin_id, 'APPROVE_PARTNER', 'partner_inquiries', p_inquiry_id::text,
            jsonb_build_object(
                'action_category', 'ADMIN_ACTION',
                'facility_id', v_facility_id,
                'partner_id', v_partner_id,
                'company_name', v_inquiry.company_name,
                'role_assigned', true
            ));

    -- 8. 인앱 알림 (SECURITY DEFINER 내부이므로 RLS 우회)
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
-- Step 3: 요금제 레코드 보장 (subscription_plans)
-- ─────────────────────────────────────────────
-- 시설 요금제 4개
INSERT INTO subscription_plans (name, name_en, price, sms_quota, ai_chat_quota, features)
VALUES
  ('무료체험', 'FREE', 0, 0, 0, '{"photos":3,"ai_chat":false,"sms":false,"stats":false,"badge":null,"priority":"normal"}'::jsonb),
  ('베이직', 'BASIC', 99000, 100, 100, '{"photos":-1,"ai_chat":true,"sms":true,"stats":"basic","badge":null,"priority":"normal"}'::jsonb),
  ('프리미엄', 'PREMIUM', 299000, -1, -1, '{"photos":-1,"ai_chat":true,"sms":true,"stats":"full","badge":"silver","priority":"high"}'::jsonb),
  ('엔터프라이즈', 'ENTERPRISE', 499000, -1, -1, '{"photos":-1,"ai_chat":true,"sms":true,"stats":"full","badge":"gold","priority":"top","api":true,"dedicated_manager":true}'::jsonb)
ON CONFLICT (name_en) DO NOTHING;

-- 상조 요금제 3개
INSERT INTO subscription_plans (name, name_en, price, sms_quota, ai_chat_quota, features)
VALUES
  ('상조 STARTER', 'SJ_STARTER', 3000000, 0, -1, '{"ai_consult":true,"auto_closing":true,"coupon":"300000","report":"basic","priority":"normal"}'::jsonb),
  ('상조 PROFESSIONAL', 'SJ_PROFESSIONAL', 8000000, 0, -1, '{"ai_consult":true,"crm":"advanced","dashboard":"realtime","cs":"dedicated","report":"weekly","priority":"high"}'::jsonb),
  ('상조 ENTERPRISE', 'SJ_ENTERPRISE', 15000000, 0, -1, '{"ai_consult":true,"banner":"exclusive","auto_contract":true,"manager":"dedicated","custom_branding":true,"api":true,"report":"custom","priority":"top"}'::jsonb)
ON CONFLICT (name_en) DO NOTHING;
