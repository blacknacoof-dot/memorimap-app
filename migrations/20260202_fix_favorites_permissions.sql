-- ====================================
-- 찜하기(Favorites) 및 여정(Journey) 오류 수정 스크립트
-- ====================================

-- 1. 여정 이벤트(user_journey_events) 테이블 권한 보강
-- (트리거가 SECURITY INVOKER로 실행될 경우를 대비해 INSERT/DELETE 권한 추가)
DROP POLICY IF EXISTS "Users can insert own journey events" ON public.user_journey_events;
CREATE POLICY "Users can insert own journey events"
ON public.user_journey_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journey events" ON public.user_journey_events;
CREATE POLICY "Users can delete own journey events"
ON public.user_journey_events FOR DELETE
USING (auth.uid() = user_id);

-- 2. 트리거 함수를 SECURITY DEFINER로 변경 (권한 문제 방지)
-- 찜 추가 시 자동 생성 함수
CREATE OR REPLACE FUNCTION public.auto_create_favorite_journey_event()
RETURNS TRIGGER AS $$
DECLARE
  v_facility_name TEXT;
BEGIN
  -- 시설 이름 가져오기
  SELECT name INTO v_facility_name
  FROM facilities
  WHERE id = NEW.facility_id;
  
  -- 여정 이벤트 자동 생성
  INSERT INTO public.user_journey_events (
    user_id, 
    event_type, 
    event_title, 
    event_description,
    facility_id,
    event_date
  )
  VALUES (
    NEW.user_id,
    'facility_visit',
    COALESCE(v_facility_name, '시설') || '을(를) 찜했습니다.',
    CASE 
      WHEN NEW.private_memo IS NOT NULL THEN '메모: ' || NEW.private_memo
      ELSE NULL
    END,
    NEW.facility_id,
    CURRENT_DATE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 찜 해제 시 자동 삭제 함수
CREATE OR REPLACE FUNCTION public.auto_delete_favorite_journey_event()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_journey_events
  WHERE user_id = OLD.user_id 
  AND facility_id = OLD.facility_id
  AND event_type = 'facility_visit';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 토글 함수(RPC) 안전성 강화
CREATE OR REPLACE FUNCTION public.toggle_favorite(
  p_facility_id UUID,
  p_private_memo TEXT DEFAULT NULL,
  p_private_rating INTEGER DEFAULT NULL
)
RETURNS SETOF public.user_favorites
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- 이미 찜했는지 확인
  SELECT EXISTS(
    SELECT 1 FROM public.user_favorites 
    WHERE user_id = v_user_id AND facility_id = p_facility_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- 이미 찜한 경우 업데이트
    RETURN QUERY
    UPDATE public.user_favorites
    SET 
      private_memo = COALESCE(p_private_memo, private_memo),
      private_rating = COALESCE(p_private_rating, private_rating)
    WHERE user_id = v_user_id AND facility_id = p_facility_id
    RETURNING *;
  ELSE
    -- 새로 찜하기
    RETURN QUERY
    INSERT INTO public.user_favorites (user_id, facility_id, private_memo, private_rating)
    VALUES (v_user_id, p_facility_id, p_private_memo, p_private_rating)
    RETURNING *;
  END IF;
END;
$$;
