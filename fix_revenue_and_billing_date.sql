-- ========================================================
-- 매출 연동 및 구독 결제일 관리 보정 패치 (v7.1 - 최종 무결성 및 Clerk 호환)
-- ========================================================

-- [주의] 이 스크립트는 DDL을 포함하고 있으므로, 
-- Supabase SQL Editor 등에서 'Read-only' 모드를 끄고 실행해야 합니다.

-- 1. 필수 컬럼이 없는 경우를 대비하여 컬럼 추가
DO $$ 
BEGIN 
    -- facility_subscriptions 테이블 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'facility_subscriptions' AND COLUMN_NAME = 'facility_id_uuid') THEN
        ALTER TABLE facility_subscriptions ADD COLUMN facility_id_uuid uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'facility_subscriptions' AND COLUMN_NAME = 'next_billing_date') THEN
        ALTER TABLE facility_subscriptions ADD COLUMN next_billing_date timestamp without time zone;
    END IF;

    -- subscription_payments 테이블 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'subscription_payments' AND COLUMN_NAME = 'final_amount') THEN
        ALTER TABLE subscription_payments ADD COLUMN final_amount numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'subscription_payments' AND COLUMN_NAME = 'description') THEN
        ALTER TABLE subscription_payments ADD COLUMN description text;
    END IF;
END $$;

-- 2. is_super_admin 함수 수정 (Clerk ID 호환성 확보)
-- auth.uid() 대신 (auth.jwt() ->> 'sub') 사용하여 UUID 캐스팅 오류 방지
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = (auth.jwt() ->> 'sub')
        AND role = 'super_admin'
    );
EXCEPTION 
    WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 매출 집계 뷰 (admin_subscriptions_with_facility) 재생성
DROP VIEW IF EXISTS admin_subscriptions_with_facility;
CREATE OR REPLACE VIEW admin_subscriptions_with_facility AS
SELECT 
    fs.*,
    f.name as facility_name,
    sp.name as plan_name
FROM facility_subscriptions fs
LEFT JOIN facilities f ON f.id = fs.facility_id_uuid
LEFT JOIN subscription_plans sp ON (
    fs.plan_id = sp.name OR 
    fs.plan_id = sp.name_en OR 
    (fs.plan_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND fs.plan_id::uuid = sp.id)
);

-- 4. 기존 데이터를 기반으로 UUID 컬럼 채우기
UPDATE facility_subscriptions fs
SET facility_id_uuid = f.id
FROM facilities f
WHERE fs.facility_id_uuid IS NULL 
  AND (f.id::text = fs.facility_id::text OR (f.legacy_id IS NOT NULL AND f.legacy_id::text = fs.facility_id::text));

-- 5. 기존 구독 데이터의 재결제 예정일(next_billing_date) 초기화
UPDATE facility_subscriptions
SET next_billing_date = started_at + INTERVAL '1 month'
WHERE next_billing_date IS NULL AND started_at IS NOT NULL;

-- 6. subscription_payments 테이블 RLS 정책 보강 (Clerk 호환)
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin Manage All Payments" ON subscription_payments;
CREATE POLICY "Super Admin Manage All Payments"
ON subscription_payments
FOR ALL
USING (is_super_admin());

DROP POLICY IF EXISTS "Facility Admin View Own Payments" ON subscription_payments;
CREATE POLICY "Facility Admin View Own Payments"
ON subscription_payments
FOR SELECT
USING (
    is_super_admin() OR
    EXISTS (
        SELECT 1 FROM facility_subscriptions fs
        JOIN facilities f ON f.id = fs.facility_id_uuid
        WHERE fs.id = subscription_payments.subscription_id
        AND f.user_id = (auth.jwt() ->> 'sub')
    )
);

-- 7. 매출 통계 누락 방지를 위한 기존 구독 데이터 기반 최소 결제 내역 생성
-- [Fix] truncated INSERT fixed and updated_at removed as it does not exist in schema
INSERT INTO subscription_payments (
    subscription_id, 
    amount, 
    final_amount, 
    status, 
    payment_method, 
    paid_at, 
    description,
    created_at
)
SELECT 
    fs.id, 
    sp.price, 
    sp.price, 
    'completed', 
    'card', 
    COALESCE(fs.started_at, fs.created_at, NOW()), 
    '[복구] ' || sp.name || ' 플랜 결제',
    NOW()
FROM facility_subscriptions fs
JOIN subscription_plans sp ON (
    fs.plan_id = sp.name OR 
    fs.plan_id = sp.name_en OR 
    (fs.plan_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND fs.plan_id::uuid = sp.id)
)
LEFT JOIN subscription_payments pay ON fs.id = pay.subscription_id
WHERE pay.id IS NULL 
  AND sp.price > 0 
  AND (fs.facility_id_uuid IS NOT NULL OR fs.facility_id IS NOT NULL);

-- 8. 최종 결과 확인 쿼리
SELECT fs.id, f.name, fs.next_billing_date, COUNT(p.id) as payment_count
FROM facility_subscriptions fs
LEFT JOIN facilities f ON f.id = fs.facility_id_uuid
LEFT JOIN subscription_payments p ON fs.id = p.subscription_id
GROUP BY fs.id, f.name, fs.next_billing_date;
