-- ==========================================
-- Week 3: Stored Procedure & Transaction
-- File: scripts/week3/create_timeline_proc_v2.sql
-- ==========================================

-- 사전 작업: notification_logs 테이블이 없거나 target_user_id가 없을 수 있으므로 확인/생성
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES timeline_events(id),
    target_user_id UUID REFERENCES auth.users(id), -- 알림 받을 대상
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- (선택사항) 만약 기존 테이블에 target_user_id가 없다면 추가
-- ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id);


-- Function: update_timeline_and_notify
-- 설명: 타임라인 상태를 업데이트하고, 해당 예약자에게 보낼 알림을 생성합니다. (Atomic)
CREATE OR REPLACE FUNCTION update_timeline_and_notify(
  p_event_id UUID,
  p_status TEXT,
  p_completed_at TIMESTAMPTZ
) RETURNS VOID AS $$
DECLARE
  v_reservation_id UUID;
  v_user_id UUID;
BEGIN
  -- 1. Timeline Update & Get Reservation Info
  --    타임라인 이벤트를 업데이트하면서, 연결된 예약 ID를 가져옵니다.
  UPDATE timeline_events
  SET status = p_status, completed_at = p_completed_at
  WHERE id = p_event_id
  RETURNING reservation_id INTO v_reservation_id;

  -- 예외 처리: 해당 이벤트가 없을 경우
  IF v_reservation_id IS NULL THEN
    RAISE EXCEPTION 'Timeline event not found with ID %', p_event_id;
  END IF;

  -- 2. Get User ID from Reservation (알림 대상 식별)
  --    예약 정보에서 실제 사용자(고객) ID를 조회합니다.
  SELECT user_id INTO v_user_id 
  FROM reservations 
  WHERE id = v_reservation_id;

  -- 3. Notification Log (Target User 지정)
  --    알림 로그를 생성합니다. (Edge Function이 이를 트리거로 발송 처리)
  INSERT INTO notification_logs (event_id, target_user_id, status, created_at)
  VALUES (p_event_id, v_user_id, 'pending', NOW());
  
  -- 트랜잭션은 함수 종료 시 자동으로 커밋됩니다.
END;
$$ LANGUAGE plpgsql;
