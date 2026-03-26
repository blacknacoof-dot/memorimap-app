-- subscription_payments에 billing_period 컬럼 추가
-- verify-payment EF에서 결제이력 저장 시 사용
ALTER TABLE subscription_payments
    ADD COLUMN IF NOT EXISTS billing_period_start DATE,
    ADD COLUMN IF NOT EXISTS billing_period_end DATE;

COMMENT ON COLUMN subscription_payments.billing_period_start IS '결제 기간 시작일';
COMMENT ON COLUMN subscription_payments.billing_period_end IS '결제 기간 종료일';
