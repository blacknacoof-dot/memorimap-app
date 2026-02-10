-- ====================================
-- 1. 찜 목록 (Favorites)
-- ====================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  private_memo TEXT, -- 개인 메모 (예: "접근성이 좋음")
  private_rating INTEGER CHECK (private_rating >= 1 AND private_rating <= 5), -- 1-5점
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, facility_id) -- 중복 찜 방지
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_favorites_user_created 
ON public.user_favorites(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_facility 
ON public.user_favorites(facility_id);

-- RLS 정책
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재생성 위해)
DROP POLICY IF EXISTS "Users can view own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Admins can view all favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;

-- 본인 찜 목록만 조회
CREATE POLICY "Users can view own favorites"
ON public.user_favorites FOR SELECT
USING (auth.uid() = user_id);

-- 관리자는 모든 찜 목록 조회 가능 (is_super_admin 함수 사용 권장)
CREATE POLICY "Admins can view all favorites"
ON public.user_favorites FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Users can manage own favorites"
ON public.user_favorites FOR ALL
USING (auth.uid() = user_id);

-- ====================================
-- 2. 엔딩 노트 (Ending Note)
-- ====================================
CREATE TABLE IF NOT EXISTS public.user_ending_note (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_method TEXT[], -- 선호 방식 (예: ['수목장', '가족장 중심'])
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT, -- 관계 (예: '배우자', '자녀')
  final_message TEXT, -- 한 줄 메모
  photo_preference TEXT, -- 사진 선호사항
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.user_ending_note ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ending note" ON public.user_ending_note;
DROP POLICY IF EXISTS "Admins can view all ending notes" ON public.user_ending_note;
DROP POLICY IF EXISTS "Users can manage own ending note" ON public.user_ending_note;

CREATE POLICY "Users can view own ending note"
ON public.user_ending_note FOR SELECT
USING (auth.uid() = user_id);

-- 관리자는 모든 엔딩 노트 조회 가능
CREATE POLICY "Admins can view all ending notes"
ON public.user_ending_note FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Users can manage own ending note"
ON public.user_ending_note FOR ALL
USING (auth.uid() = user_id);

-- ====================================
-- 3. 찜 추가 시 자동으로 여정 이벤트 생성
-- ====================================
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
  -- (유저 journey 테이블이 없다면 에러가 날 수 있으므로 확인 필요, 여기서는 있다고 가정)
  -- user_journey_events 테이블 존재 여부 체크는 생략 (사전 조건)
  INSERT INTO user_journey_events (
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
    v_facility_name || '을(를) 찜했습니다.',
    CASE 
      WHEN NEW.private_memo IS NOT NULL THEN '메모: ' || NEW.private_memo
      ELSE NULL
    END,
    NEW.facility_id,
    CURRENT_DATE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_journey_on_favorite ON public.user_favorites;
CREATE TRIGGER trigger_auto_journey_on_favorite
AFTER INSERT ON public.user_favorites
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_favorite_journey_event();

-- ====================================
-- 4. 찜 해제 시 여정 이벤트 삭제
-- ====================================
CREATE OR REPLACE FUNCTION public.auto_delete_favorite_journey_event()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM user_journey_events
  WHERE user_id = OLD.user_id 
  AND facility_id = OLD.facility_id
  AND event_type = 'facility_visit';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_delete_journey_on_unfavorite ON public.user_favorites;
CREATE TRIGGER trigger_auto_delete_journey_on_unfavorite
AFTER DELETE ON public.user_favorites
FOR EACH ROW
EXECUTE FUNCTION public.auto_delete_favorite_journey_event();
