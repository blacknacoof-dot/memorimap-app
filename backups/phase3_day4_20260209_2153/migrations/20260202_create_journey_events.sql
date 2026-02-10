-- ====================================
-- 여정 이벤트 (Journey Events) 테이블 생성
-- ====================================
CREATE TABLE IF NOT EXISTS public.user_journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'facility_visit' (찜), 'consultation' (상담), 'ending_note' (작성) 등
  event_title TEXT NOT NULL,
  event_description TEXT,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL, -- 관련 시설이 있는 경우
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_journey_user_date 
ON public.user_journey_events(user_id, event_date DESC);

-- RLS 정책
ALTER TABLE public.user_journey_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own journey events" ON public.user_journey_events;
DROP POLICY IF EXISTS "Admins can view all journey events" ON public.user_journey_events;

CREATE POLICY "Users can view own journey events"
ON public.user_journey_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all journey events"
ON public.user_journey_events FOR SELECT
USING (public.is_super_admin());

-- 트리거용: 유저가 자기 여정을 생성/삭제할 수 있도록 권한 부여 (필요 시)
-- 자동 생성을 위한 트리거 등은 SECURITY DEFINER 함수로 처리되므로 INSERT 권한이 필수적인 건 아니나,
-- 수동 추가 기능이 있다면 필요함. 일단 SELECT만 허용하고, 트리거가 처리하도록 함.
-- 만약 클라이언트에서 직접 추가해야 한다면 아래 정책 추가:
-- CREATE POLICY "Users can insert own journey events" ...
