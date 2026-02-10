-- ==========================================
-- Week 3: Global RLS Policies (Enhanced)
-- File: scripts/week3/apply_rls_policies_v2.sql
-- ==========================================

-- 1. bot_data RLS
-- 설멍: 챗봇 데이터는 누구나 읽을 수 있지만, 수정은 시설 소유자(Owner)만 가능합니다.
ALTER TABLE bot_data ENABLE ROW LEVEL SECURITY;

-- 기존 정책 정리 (충돌 방지)
DROP POLICY IF EXISTS "Public Read" ON bot_data;
DROP POLICY IF EXISTS "Owner Write" ON bot_data;

CREATE POLICY "Public Read" ON bot_data FOR SELECT USING (true);

CREATE POLICY "Owner Write" ON bot_data FOR ALL USING (
  -- bot_data.facility_id가 NULL인 경우(글로벌 설정)는 슈퍼어드민만? (일단 Owner 로직에 집중)
  -- 여기서는 연결된 memorial_spaces의 owner_user_id가 현재 auth.uid()와 일치하는지 확인
  EXISTS (
    SELECT 1 FROM memorial_spaces ms 
    WHERE ms.id = bot_data.facility_id 
    AND ms.owner_user_id = auth.uid()
  )
);

-- 2. timeline_events RLS
-- 설명: 타임라인은 시설 관계자(Owner)와 해당 예약자(User)만 볼 수 있습니다.
--      (중요) 쓰기(INSERT/UPDATE)는 오직 시설 관리자(Owner)만 가능합니다.
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stakeholder Read" ON timeline_events;
DROP POLICY IF EXISTS "Manager Write" ON timeline_events;

-- 읽기 정책: 소유자 또는 예약 당사자
CREATE POLICY "Stakeholder Read" ON timeline_events FOR SELECT USING (
  -- Facility Owner
  EXISTS (
    SELECT 1 FROM memorial_spaces ms 
    WHERE ms.id = timeline_events.facility_id 
    AND ms.owner_user_id = auth.uid()
  )
  OR
  -- Reservation User
  EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.id = timeline_events.reservation_id 
    AND r.user_id = auth.uid()
  )
);

-- 쓰기 정책: 시설 관리자만 가능
CREATE POLICY "Manager Write" ON timeline_events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM memorial_spaces ms 
    WHERE ms.id = timeline_events.facility_id 
    AND ms.owner_user_id = auth.uid()
  )
);

-- 3. facility_submissions RLS
-- 설명: 제휴 신청 데이터는 슈퍼 관리자(Super Admin)만 제어할 수 있습니다.
--      (public.users 테이블의 role='admin' 체크 방식 사용)
ALTER TABLE facility_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin Control" ON facility_submissions;

CREATE POLICY "Super Admin Control" ON facility_submissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
