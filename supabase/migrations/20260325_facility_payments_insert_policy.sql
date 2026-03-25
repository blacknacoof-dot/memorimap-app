-- ============================================================
-- facility/sangjo 결제이력 INSERT 정책 추가
-- 2026-03-25
-- ============================================================
-- 배경:
--   updateFacilitySubscription()은 auth client로 subscription_payments insert를 수행한다.
--   그러나 pricing v1 신규 정책은 service_role(전체) + authenticated(personal만) 구조다.
--   facility/sangjo 결제 insert를 위한 authenticated 정책이 누락된 상태.
--
-- 해결:
--   facility 소유자가 본인 시설 구독의 결제이력을 insert할 수 있는 정책 추가.
--   이후 구정책 payments_insert_service_or_owner를 안전하게 DROP.
-- ============================================================

-- 1. facility/sangjo 결제 insert 정책 추가
CREATE POLICY "subscription_payments_insert_facility"
  ON subscription_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    payment_context = 'facility'
    AND subscription_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM facility_subscriptions fs
      WHERE fs.id::text = subscription_payments.subscription_id::text
        AND EXISTS (
          SELECT 1 FROM facilities f
          WHERE (f.id::text = fs.facility_id_uuid::text OR f.legacy_id::text = fs.facility_id_bigint::text)
            AND f.user_id = public.clerk_user_id()
        )
    )
  );

-- 2. 구정책 제거 (신규 정책으로 대체 완료)
DROP POLICY IF EXISTS "payments_insert_service_or_owner" ON subscription_payments;
