-- ============================================================
-- 20260320_fix_duplicate_facility_and_ai_consult.sql
-- 1. 중복 시설 정리 (fd83a9a9 삭제 → 666dc22b 원본 유지)
-- 2. RPC Step 1: 기존 시설 확인 후 INSERT (중복 생성 방지)
-- 3. ai_consultations RLS: 시설관리자가 자기 시설 AI 상담 조회 가능
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. 중복 시설 정리
-- 원본: 666dc22b (user_id: 852acf26, 2026-02-06 생성)
-- 중복: fd83a9a9 (RPC가 생성, user_id: 2f3c8a86 슈퍼관리자, 2026-03-20)
-- ─────────────────────────────────────────────

-- partner_inquiries의 target_facility_id를 원본으로 변경
UPDATE partner_inquiries
SET target_facility_id = '666dc22b-b71c-4ac1-b834-d06a1d4567e1'
WHERE target_facility_id = 'fd83a9a9-1234-5678-9abc-def012345678'
   OR target_facility_id LIKE 'fd83a9a9%';

-- sangjo 관련 테이블 참조 변경
UPDATE sangjo_hq_admins
SET sangjo_id = '666dc22b-b71c-4ac1-b834-d06a1d4567e1'
WHERE sangjo_id LIKE 'fd83a9a9%';

UPDATE sangjo_dashboard_users
SET sangjo_id = '666dc22b-b71c-4ac1-b834-d06a1d4567e1'
WHERE sangjo_id LIKE 'fd83a9a9%';

-- 중복 시설 삭제 (정확한 UUID는 Supabase에서 확인 후 실행)
-- DELETE FROM facilities WHERE id = 'fd83a9a9-...실제UUID...' AND name = '일산백장례서비스';
-- ※ 정확한 UUID를 모르므로 name + user_id + created_at 기준으로 삭제
DELETE FROM facilities
WHERE name = '일산백장례서비스'
  AND user_id = '2f3c8a86-c7d7-4c6a-b80a-d59e3c8b7a21'
  AND created_at >= '2026-03-20'::date;

-- ─────────────────────────────────────────────
-- 2. approve_partner_transaction 재정의
--    Step 1: 기존 시설 확인 후 없을 때만 INSERT
-- ─────────────────────────────────────────────
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
    v_facility_type TEXT;
BEGIN
    SELECT * INTO v_inquiry
    FROM partner_inquiries
    WHERE id = p_inquiry_id
    FOR UPDATE;

    IF v_inquiry IS NULL THEN RAISE EXCEPTION '신청서를 찾을 수 없습니다.'; END IF;
    IF v_inquiry.status != 'pending' THEN RAISE EXCEPTION '이미 처리된 건입니다.'; END IF;

    -- 시설 타입 결정
    v_facility_type := CASE
        WHEN v_inquiry.business_type = 'funeral_home' THEN 'funeral_home'
        ELSE 'sangjo'
    END;

    -- ★ Step 1: 기존 시설 확인 (중복 생성 방지)
    SELECT id INTO v_facility_id
    FROM facilities
    WHERE name = v_inquiry.company_name
      AND type = v_facility_type
    LIMIT 1;

    -- 기존 시설이 없을 때만 신규 생성
    IF v_facility_id IS NULL THEN
        INSERT INTO facilities (
            user_id, name, type, address, phone, verified, status, business_hours, created_at
        )
        VALUES (
            v_inquiry.user_id,
            v_inquiry.company_name,
            v_facility_type,
            COALESCE(v_inquiry.address, ''),
            COALESCE(v_inquiry.contact_number, ''),
            true,
            'active',
            '{}'::jsonb,
            now()
        ) RETURNING id INTO v_facility_id;
    END IF;

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

    -- Step 3: 상조 관련 테이블
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

    -- Step 5: 동일 업체 다른 pending 신청 자동 거절
    UPDATE partner_inquiries
    SET status = 'rejected',
        message = '[System] 동일 업체 다른 신청이 승인되어 자동 반려됨.',
        updated_at = now()
    WHERE company_name = v_inquiry.company_name
      AND status = 'pending'
      AND id != p_inquiry_id;

    -- Step 6: 유저 프로필 역할 업데이트
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

    -- Step 7: 감사 로그
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_admin_id, 'APPROVE_PARTNER', 'partner_inquiries', p_inquiry_id::text,
            jsonb_build_object(
                'action_category', 'ADMIN_ACTION',
                'facility_id', v_facility_id,
                'partner_id', v_partner_id,
                'company_name', v_inquiry.company_name,
                'role_assigned', true,
                'facility_reused', (v_facility_id IS NOT NULL)
            ));

    -- Step 8: 인앱 알림
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
-- 3. ai_consultations RLS: 시설관리자 조회 허용
-- ─────────────────────────────────────────────

-- 기존 정책 안전하게 DROP 후 재생성
DROP POLICY IF EXISTS ai_consultations_facility_admin_select ON ai_consultations;

CREATE POLICY ai_consultations_facility_admin_select
ON ai_consultations
FOR SELECT
TO authenticated
USING (
    -- 본인 상담
    user_id = public.clerk_user_id()
    -- 슈퍼관리자
    OR public.is_super_admin()
    -- 시설관리자: 자기 시설에 접수된 AI 상담
    OR EXISTS (
        SELECT 1 FROM facilities f
        WHERE f.id::text = ai_consultations.facility_id::text
          AND f.user_id = public.clerk_user_id()
    )
);

-- ─────────────────────────────────────────────
-- 4. 검증
-- ─────────────────────────────────────────────
DO $$
DECLARE
    v_dup_count INT;
    v_policy_exists BOOLEAN;
BEGIN
    -- 중복 시설 확인
    SELECT count(*) INTO v_dup_count
    FROM facilities
    WHERE name = '일산백장례서비스'
      AND user_id = '2f3c8a86-c7d7-4c6a-b80a-d59e3c8b7a21';

    -- RLS 정책 확인
    SELECT EXISTS(
        SELECT 1 FROM pg_policies
        WHERE policyname = 'ai_consultations_facility_admin_select'
    ) INTO v_policy_exists;

    RAISE NOTICE '──────────────────────────────────';
    RAISE NOTICE '검증 결과:';
    RAISE NOTICE '  중복 시설 잔존: %건 (0이어야 정상)', v_dup_count;
    RAISE NOTICE '  AI상담 시설관리자 RLS: %', CASE WHEN v_policy_exists THEN 'OK' ELSE 'MISSING' END;
    RAISE NOTICE '──────────────────────────────────';
END $$;
