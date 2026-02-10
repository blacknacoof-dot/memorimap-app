-- funeral_progress 테이블 생성
-- 상조 회사 직원이 장례 진행 단계를 업데이트하면 유족에게 실시간 공유

CREATE TABLE IF NOT EXISTS funeral_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT REFERENCES sangjo_contracts(contract_number) ON DELETE CASCADE,
    current_status TEXT DEFAULT 'WAITING' CHECK (current_status IN ('WAITING', 'MORTUARY', 'ENCOFFINING', 'DEPARTURE', 'ARRIVED')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Row Level Security 활성화
ALTER TABLE funeral_progress ENABLE ROW LEVEL SECURITY;

-- 상조 파트너는 자신의 계약에 대해서만 업데이트 가능
CREATE POLICY "Partners can update their contract progress"
ON funeral_progress
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM sangjo_contracts sc
        WHERE sc.contract_number = funeral_progress.contract_number
    )
);

-- 유족(계약자)은 자신의 계약 진행 상황 조회 가능
CREATE POLICY "Users can view their contract progress"
ON funeral_progress
FOR SELECT
USING (true);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_funeral_progress_contract_number ON funeral_progress(contract_number);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_funeral_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_funeral_progress_timestamp ON funeral_progress;
CREATE TRIGGER trigger_update_funeral_progress_timestamp
    BEFORE UPDATE ON funeral_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_funeral_progress_timestamp();

