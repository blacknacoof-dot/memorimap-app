
-- 1. 사용자에게 보낼 답변 내용 컬럼
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS answer TEXT;

-- 2. 답변이 작성된 시간 (정렬 및 배지 표시에 사용)
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ;

-- 3. (NEW) 관리자가 읽었는지 여부 (안 읽음 배지용)
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;


-- ⚠️ 보안 관련 참고 (Production 배포 전 필수 적용)
-- 현재는 개발 편의를 위해 모든 유저가 조회 가능할 수 있습니다.
-- 배포 전에는 반드시 아래와 같이 자신의 시설만 조회하도록 정책을 수정해야 합니다.
/*
CREATE POLICY "Facility Managers can view own consultations"
ON consultations FOR SELECT
TO authenticated
USING (
  facility_id IN (
    SELECT id FROM facilities WHERE manager_id = auth.uid()
  )
);
*/
