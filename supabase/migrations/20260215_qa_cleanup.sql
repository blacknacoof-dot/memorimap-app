-- 🧹 QA 테스트 데이터 전체 삭제 (검증 완료 후 실행)
DO $$
DECLARE
    v_clerk_id TEXT := 'user_37p5nXKhEYC4vCk2Q0KTR068KvB';
BEGIN
    DELETE FROM subscription_payments WHERE description LIKE '%QA 테스트%';
    DELETE FROM facility_subscriptions WHERE facility_id_uuid IN (
        SELECT id FROM facilities WHERE user_id = v_clerk_id AND name = 'QA 테스트 장례식장'
    );
    DELETE FROM reservations WHERE user_id = v_clerk_id;
    DELETE FROM consultations WHERE user_id = v_clerk_id;
    DELETE FROM favorites WHERE user_id = v_clerk_id;
    DELETE FROM user_ending_notes WHERE user_id = v_clerk_id;
    DELETE FROM sangjo_contracts WHERE customer_phone = '010-9999-0000';
    DELETE FROM sangjo_dashboard_users WHERE id = v_clerk_id;
    DELETE FROM sangjo_hq_admins WHERE user_id = v_clerk_id;
    DELETE FROM partners WHERE name = 'QA 테스트 상조';
    DELETE FROM facilities WHERE user_id = v_clerk_id AND name = 'QA 테스트 장례식장';
    DELETE FROM profiles WHERE clerk_id = v_clerk_id;

    RAISE NOTICE '🧹 QA 테스트 데이터 전체 삭제 완료';
END $$;
