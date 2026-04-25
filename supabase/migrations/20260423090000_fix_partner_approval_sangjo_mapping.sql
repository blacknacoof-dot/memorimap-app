-- Protect existing sangjo admin mappings during partner approval.
-- The previous latest definition of approve_partner_transaction reintroduced
-- ON CONFLICT DO UPDATE for sangjo_dashboard_users, which could move an
-- existing sangjo admin to a newly approved company.

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
    v_existing_sangjo TEXT;
    v_is_sangjo BOOLEAN;
BEGIN
    SELECT * INTO v_inquiry
    FROM partner_inquiries
    WHERE id = p_inquiry_id
    FOR UPDATE;

    IF v_inquiry IS NULL THEN
        RAISE EXCEPTION 'Inquiry not found.';
    END IF;

    IF v_inquiry.status != 'pending' THEN
        RAISE EXCEPTION 'Inquiry has already been processed.';
    END IF;

    v_is_sangjo := v_inquiry.business_type IN ('sangjo_hq', 'sangjo');

    IF v_is_sangjo THEN
        SELECT sangjo_id INTO v_existing_sangjo
        FROM sangjo_dashboard_users
        WHERE id = v_inquiry.user_id;
    END IF;

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
    )
    RETURNING id INTO v_facility_id;

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
    )
    RETURNING id INTO v_partner_id;

    -- Only create a sangjo dashboard mapping when this user does not already
    -- manage a sangjo company. Existing mappings must not be overwritten.
    IF v_is_sangjo AND v_existing_sangjo IS NULL THEN
        INSERT INTO sangjo_hq_admins (user_id, sangjo_id, company_name, role)
        VALUES (v_inquiry.user_id, v_facility_id::text, v_inquiry.company_name, 'hq_admin')
        ON CONFLICT DO NOTHING;

        INSERT INTO sangjo_dashboard_users (id, sangjo_id, role, name)
        VALUES (v_inquiry.user_id, v_facility_id::text, 'admin', v_inquiry.company_name)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    UPDATE partner_inquiries
    SET status = 'approved',
        target_facility_id = v_facility_id::text,
        updated_at = now()
    WHERE id = p_inquiry_id;

    -- Reject only exact duplicate pending inquiries. Company name alone is not
    -- enough because branches, business types, or login emails can differ.
    UPDATE partner_inquiries
    SET status = 'rejected',
        message = '[System] Another pending inquiry with the same company, type, email, phone, and address was automatically rejected after approval.',
        updated_at = now()
    WHERE lower(btrim(COALESCE(company_name, ''))) = lower(btrim(COALESCE(v_inquiry.company_name, '')))
      AND lower(btrim(COALESCE(business_type, ''))) = lower(btrim(COALESCE(v_inquiry.business_type, '')))
      AND lower(btrim(COALESCE(company_email, email, ''))) = lower(btrim(COALESCE(v_inquiry.company_email, v_inquiry.email, '')))
      AND lower(btrim(COALESCE(contact_number, manager_mobile, phone, ''))) = lower(btrim(COALESCE(v_inquiry.contact_number, v_inquiry.manager_mobile, v_inquiry.phone, '')))
      AND lower(btrim(COALESCE(address, ''))) = lower(btrim(COALESCE(v_inquiry.address, '')))
      AND status = 'pending'
      AND id != p_inquiry_id;

    -- Preserve super_admin and existing sangjo mappings. A user who already
    -- has a sangjo mapping keeps their current role/dashboard link.
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
      AND role != 'super_admin'::public.user_role
      AND NOT (v_is_sangjo AND v_existing_sangjo IS NOT NULL);

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
        p_admin_id,
        'APPROVE_PARTNER',
        'partner_inquiries',
        p_inquiry_id::text,
        jsonb_build_object(
            'action_category', 'ADMIN_ACTION',
            'facility_id', v_facility_id,
            'partner_id', v_partner_id,
            'company_name', v_inquiry.company_name,
            'business_type', v_inquiry.business_type,
            'existing_sangjo', v_existing_sangjo,
            'sangjo_mapping_created', v_is_sangjo AND v_existing_sangjo IS NULL,
            'role_assigned', NOT (v_is_sangjo AND v_existing_sangjo IS NOT NULL)
        )
    );

    INSERT INTO user_notifications (user_id, title, message, type, link)
    VALUES (
        v_inquiry.user_id,
        '입점 신청 승인 완료',
        '입점 신청이 승인되었습니다. 관리자 대시보드에서 정보를 확인해 주세요.',
        'success',
        '/dashboard'
    );

    RETURN jsonb_build_object(
        'success', true,
        'facility_id', v_facility_id,
        'partner_id', v_partner_id,
        'action', 'approved',
        'warning', CASE
            WHEN v_is_sangjo AND v_existing_sangjo IS NOT NULL
                THEN '기존 상조 관리자 매핑이 있어 새 상조 대시보드 연결은 만들지 않았습니다. 기존 매핑은 유지됩니다.'
            ELSE NULL
        END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
