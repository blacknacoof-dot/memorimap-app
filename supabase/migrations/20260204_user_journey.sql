BEGIN;

-- =============================================
-- 1. 테이블 초기화 및 생성 (UUID vs TEXT 불일치 해결을 위해 DROP 후 재생성)
-- =============================================

-- 기존에 잘못된 타입(UUID)으로 생성된 테이블이 있을 수 있으므로 드롭
DROP TABLE IF EXISTS public.user_journey_logs CASCADE;
DROP TABLE IF EXISTS public.user_ending_notes CASCADE;

-- 1.1 나의 여정 기록 (타임라인) 테이블
CREATE TABLE public.user_journey_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk User ID (user_xxx)
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_journey_logs_user_id ON public.user_journey_logs(user_id);

-- 1.2 엔딩 노트 (사용자 선호도) 테이블
CREATE TABLE public.user_ending_notes (
  user_id TEXT PRIMARY KEY, -- Clerk User ID (user_xxx)
  preferred_types TEXT[],
  emergency_contact TEXT,
  final_memo TEXT,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. RLS 활성화 및 세분화 정책 (Genius Patch 반영)
-- =============================================
ALTER TABLE IF EXISTS public.user_journey_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_ending_notes ENABLE ROW LEVEL SECURITY;

-- 2.1 user_journey_logs 정책: JWT의 sub(Clerk ID)와 비교
-- 주의: Supabase-Clerk 연동 시 auth.jwt() ->> 'sub'에 Clerk ID가 담깁니다.
DO $$ 
BEGIN 
    -- SELECT
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'journey_logs_select') THEN 
        CREATE POLICY "journey_logs_select" ON public.user_journey_logs 
        FOR SELECT TO authenticated USING (auth.jwt() ->> 'sub' = user_id); 
    END IF;

    -- INSERT
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'journey_logs_insert') THEN 
        CREATE POLICY "journey_logs_insert" ON public.user_journey_logs 
        FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'sub' = user_id); 
    END IF;

    -- UPDATE
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'journey_logs_update') THEN 
        CREATE POLICY "journey_logs_update" ON public.user_journey_logs 
        FOR UPDATE TO authenticated USING (auth.jwt() ->> 'sub' = user_id) WITH CHECK (auth.jwt() ->> 'sub' = user_id); 
    END IF;

    -- DELETE
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'journey_logs_delete') THEN 
        CREATE POLICY "journey_logs_delete" ON public.user_journey_logs 
        FOR DELETE TO authenticated USING (auth.jwt() ->> 'sub' = user_id); 
    END IF; 
END $$;

-- 2.2 user_ending_notes 정책
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'ending_notes_select') THEN 
        CREATE POLICY "ending_notes_select" ON public.user_ending_notes 
        FOR SELECT TO authenticated USING (auth.jwt() ->> 'sub' = user_id); 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'ending_notes_insert') THEN 
        CREATE POLICY "ending_notes_insert" ON public.user_ending_notes 
        FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'sub' = user_id); 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'ending_notes_update') THEN 
        CREATE POLICY "ending_notes_update" ON public.user_ending_notes 
        FOR UPDATE TO authenticated USING (auth.jwt() ->> 'sub' = user_id) WITH CHECK (auth.jwt() ->> 'sub' = user_id); 
    END IF;
END $$;

-- =============================================
-- 3. 트리거 함수: 예외 처리 및 방어적 로직 강화 (Genius Patch V4 - DEBUG)
-- =============================================

CREATE OR REPLACE FUNCTION public.auto_log_favorite_journey() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$ 
DECLARE 
    v_facility_name TEXT; 
BEGIN 
    -- 1. 시설 이름 조회 (id 매칭, NULL 방어 - NEW.facility_id가 TEXT일 수 있으므로 ::uuid 캐스팅)
    SELECT name INTO v_facility_name FROM public.facilities WHERE id = NEW.facility_id::uuid;

    -- 2. 로그 삽입
    INSERT INTO public.user_journey_logs (user_id, event_type, title, description) 
    VALUES ( 
        NEW.user_id, 
        'LIKE', 
        COALESCE(v_facility_name, '알 수 없는 시설') || '을(를) 찜했습니다.', 
        '관심 시설로 등록됨' 
    );

    RETURN NEW; 
EXCEPTION WHEN OTHERS THEN
    -- 디버깅을 위해 에러를 외부로 던짐 (프로덕션에서는 RAISE NOTICE 권장)
    RAISE EXCEPTION 'Journey Trigger Error: % (user:%, facility:%)', SQLERRM, NEW.user_id, NEW.facility_id;
END; 
$$;

-- 3.2 트리거 연결 (강제 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_favorite_added ON public.favorites;
CREATE TRIGGER on_favorite_added 
AFTER INSERT ON public.favorites 
FOR EACH ROW 
EXECUTE FUNCTION public.auto_log_favorite_journey();

-- =============================================
-- 4. user_ending_notes updated_at 자동 갱신
-- =============================================
CREATE OR REPLACE FUNCTION public.user_ending_notes_set_updated_at() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$ 
BEGIN 
    NEW.updated_at = NOW(); 
    RETURN NEW; 
END; 
$$;

DO $$ 
BEGIN 
    IF NOT EXISTS ( 
        SELECT 1 FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE t.tgname = 'user_ending_notes_set_updated_at' 
        AND c.relname = 'user_ending_notes' 
        AND n.nspname = 'public' 
    ) THEN 
        CREATE TRIGGER user_ending_notes_set_updated_at 
        BEFORE UPDATE ON public.user_ending_notes 
        FOR EACH ROW 
        EXECUTE FUNCTION public.user_ending_notes_set_updated_at(); 
    END IF; 
END $$;

-- =============================================
-- 5. RPC: get_my_journey_full (통합 조회)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_my_journey_full() 
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
-- 10x Dev Tip: auth 스키마 권한 보장을 위해 search_path 설정
SET search_path = public, auth
AS $$ 
DECLARE 
    v_user_clerk_id TEXT;
    v_logs JSONB; 
    v_note JSONB; 
BEGIN 
    -- 🔒 JWT 컨텍스트 안전성 확보
    v_user_clerk_id := auth.jwt() ->> 'sub';

    IF v_user_clerk_id IS NULL THEN 
        -- 10x Dev Tip: 400 에러 유발 대신 NULL 반환으로 프론트엔드 경합 상태 유연하게 대응
        RETURN NULL;
    END IF;

    -- 1. 타임라인 로그 조회 (최신순 3개)
    SELECT jsonb_agg(t) INTO v_logs FROM ( 
        SELECT title, description, created_at 
        FROM public.user_journey_logs 
        WHERE user_id = v_user_clerk_id 
        ORDER BY created_at DESC 
        LIMIT 3
    ) t;

    -- 2. 엔딩 노트 조회
    SELECT jsonb_build_object( 
        'preferences', preferred_types, 
        'contact', emergency_contact, 
        'memo', final_memo, 
        'percent', progress_percent 
    ) INTO v_note 
    FROM public.user_ending_notes 
    WHERE user_id = v_user_clerk_id;

    RETURN jsonb_build_object( 
        'timeline', COALESCE(v_logs, '[]'::jsonb), 
        'ending_note', v_note 
    ); 
END; 
$$;

COMMIT;
