-- =============================================
-- Week 3: Stored Procedure & Triggers
-- =============================================
-- Run this in Supabase SQL Editor AFTER week3_rls_policies.sql

-- =============================================
-- update_timeline_and_notify Stored Procedure
-- =============================================
-- 이 함수는 타임라인 이벤트를 업데이트하고
-- 동시에 알림 로그를 생성합니다 (트랜잭션으로 묶임)

CREATE OR REPLACE FUNCTION update_timeline_and_notify(
    p_event_id UUID,
    p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_event timeline_events%ROWTYPE;
    v_notification_id UUID;
    v_user_id UUID;
    v_facility_name TEXT;
    v_notification_title TEXT;
    v_notification_body TEXT;
BEGIN
    -- 1. 타임라인 이벤트 조회
    SELECT * INTO v_event
    FROM timeline_events
    WHERE id = p_event_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Timeline event not found: %', p_event_id;
    END IF;
    
    -- 2. 타임라인 이벤트 업데이트
    UPDATE timeline_events
    SET 
        scheduled_at = COALESCE(p_scheduled_at, scheduled_at),
        status = COALESCE(p_status, status),
        notes = COALESCE(p_notes, notes),
        completed_at = CASE 
            WHEN p_status = 'completed' THEN NOW() 
            ELSE completed_at 
        END,
        updated_at = NOW()
    WHERE id = p_event_id
    RETURNING * INTO v_event;
    
    -- 3. 시설 이름 조회
    SELECT name INTO v_facility_name
    FROM facilities
    WHERE id = v_event.facility_id;
    
    -- 4. 알림 제목/내용 생성
    v_notification_title := v_facility_name || ' - 일정 업데이트';
    v_notification_body := v_event.event_title || ' 일정이 변경되었습니다.';
    
    IF p_status = 'completed' THEN
        v_notification_body := v_event.event_title || '이 완료되었습니다.';
    END IF;
    
    -- 5. 알림 로그 생성 (대기 상태)
    INSERT INTO notification_logs (
        user_id,
        facility_id,
        notification_type,
        title,
        body,
        data,
        status,
        related_type,
        related_id
    ) VALUES (
        v_event.user_id,
        v_event.facility_id,
        'timeline_update',
        v_notification_title,
        v_notification_body,
        jsonb_build_object(
            'event_id', p_event_id,
            'event_type', v_event.event_type,
            'scheduled_at', v_event.scheduled_at,
            'status', v_event.status
        ),
        'pending',
        'timeline_event',
        p_event_id
    )
    RETURNING id INTO v_notification_id;
    
    -- 6. 결과 반환
    RETURN jsonb_build_object(
        'success', true,
        'event', row_to_json(v_event),
        'notification_id', v_notification_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- 트랜잭션 롤백됨
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Database Webhook Trigger
-- =============================================
-- notification_logs에 INSERT되면 Webhook 호출

-- Webhook 트리거 함수
CREATE OR REPLACE FUNCTION notify_webhook_on_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Supabase Database Webhook으로 HTTP 요청
    -- 실제 구현은 Supabase Dashboard에서 설정
    -- 이 함수는 pg_net 확장이 필요함
    
    -- pg_net이 활성화된 경우:
    -- PERFORM net.http_post(
    --     url := 'https://your-project.supabase.co/functions/v1/process-notification',
    --     headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    --     body := row_to_json(NEW)::jsonb
    -- );
    
    -- 현재는 로깅만
    RAISE LOG 'New notification created: %', NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_notification_webhook ON notification_logs;
CREATE TRIGGER trigger_notification_webhook
    AFTER INSERT ON notification_logs
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION notify_webhook_on_notification();

-- =============================================
-- Helper Functions
-- =============================================

-- 예약에 대한 기본 타임라인 이벤트 생성
CREATE OR REPLACE FUNCTION create_default_timeline_events(
    p_reservation_id UUID,
    p_facility_id UUID,
    p_user_id UUID,
    p_start_date DATE,
    p_schedule_type TEXT DEFAULT '3day'
)
RETURNS VOID AS $$
DECLARE
    v_day1 DATE;
    v_day2 DATE;
    v_day3 DATE;
BEGIN
    v_day1 := p_start_date;
    v_day2 := p_start_date + INTERVAL '1 day';
    v_day3 := p_start_date + INTERVAL '2 days';
    
    -- 입실 (Day 1)
    INSERT INTO timeline_events (facility_id, reservation_id, user_id, event_type, event_title, scheduled_at)
    VALUES (p_facility_id, p_reservation_id, p_user_id, 'admission', '입실 및 안치', v_day1 + TIME '14:00');
    
    -- 입관 (Day 2)
    INSERT INTO timeline_events (facility_id, reservation_id, user_id, event_type, event_title, scheduled_at)
    VALUES (p_facility_id, p_reservation_id, p_user_id, 'encoffin', '입관', v_day2 + TIME '10:00');
    
    IF p_schedule_type = '3day' THEN
        -- 발인 (Day 3)
        INSERT INTO timeline_events (facility_id, reservation_id, user_id, event_type, event_title, scheduled_at)
        VALUES (p_facility_id, p_reservation_id, p_user_id, 'funeral', '발인', v_day3 + TIME '07:00');
        
        -- 화장/장지 (Day 3)
        INSERT INTO timeline_events (facility_id, reservation_id, user_id, event_type, event_title, scheduled_at)
        VALUES (p_facility_id, p_reservation_id, p_user_id, 'cremation', '화장/장지 이동', v_day3 + TIME '09:00');
    ELSE
        -- 2일장: 발인 (Day 2)
        INSERT INTO timeline_events (facility_id, reservation_id, user_id, event_type, event_title, scheduled_at)
        VALUES (p_facility_id, p_reservation_id, p_user_id, 'funeral', '발인', v_day2 + TIME '14:00');
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT 'Week 3 stored procedures and triggers created successfully!' as message;
