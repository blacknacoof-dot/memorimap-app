BEGIN;

-- =============================================
-- 공유 기능을 위한 테이블 생성
-- =============================================

-- 기존 테이블이 있으면 삭제 (새로 생성)
DROP TABLE IF EXISTS public.user_shares CASCADE;

-- 공유 토큰 테이블 생성
CREATE TABLE public.user_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk User ID (user_xxx)
  share_token TEXT UNIQUE NOT NULL, -- 공유 토큰 (랜덤 문자열)
  share_password TEXT NOT NULL, -- 4자리 숫자 비밀번호
  preferences TEXT[], -- 공유할 선호 방식
  contact TEXT, -- 공유할 비상 연락망
  memo TEXT, -- 공유할 메모
  progress_percent INTEGER DEFAULT 0, -- 진행률
  is_active BOOLEAN DEFAULT TRUE, -- 활성화 상태
  view_count INTEGER DEFAULT 0, -- 조회 수
  expires_at TIMESTAMPTZ, -- 만료일 (선택사항)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_user_shares_user_id ON public.user_shares(user_id);
CREATE INDEX idx_user_shares_token ON public.user_shares(share_token);

-- RLS 활성화
ALTER TABLE public.user_shares ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 정책 설정
-- =============================================

-- 소유자만 SELECT, INSERT, UPDATE, DELETE 가능
CREATE POLICY "shares_owner_all" ON public.user_shares
FOR ALL TO authenticated 
USING (auth.jwt() ->> 'sub' = user_id)
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- 비로그인 사용자는 활성화된 공유만 토큰으로 조회 가능 (RPC용)

-- =============================================
-- 자동 업데이트 트리거
-- =============================================

CREATE OR REPLACE FUNCTION public.user_shares_set_updated_at() 
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

CREATE TRIGGER user_shares_set_updated_at 
BEFORE UPDATE ON public.user_shares 
FOR EACH ROW 
EXECUTE FUNCTION public.user_shares_set_updated_at();

-- =============================================
-- 공유 데이터 조회 RPC (비밀번호 검증 포함)
-- =============================================

CREATE OR REPLACE FUNCTION public.get_shared_journey(
  p_token TEXT,
  p_password TEXT
) 
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$ 
DECLARE 
    v_share RECORD;
    v_result JSONB;
BEGIN 
    -- 토큰으로 공유 데이터 조회
    SELECT * INTO v_share 
    FROM public.user_shares 
    WHERE share_token = p_token 
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

    -- 공유 데이터가 없으면 NULL 반환
    IF v_share IS NULL THEN 
        RETURN jsonb_build_object('error', '공유된 기록을 찾을 수 없거나 만료되었습니다.');
    END IF;

    -- 비밀번호 검증
    IF v_share.share_password != p_password THEN 
        RETURN jsonb_build_object('error', '비밀번호가 일치하지 않습니다.');
    END IF;

    -- 조회 수 증가
    UPDATE public.user_shares 
    SET view_count = view_count + 1 
    WHERE id = v_share.id;

    -- 결과 반환
    RETURN jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'preferences', v_share.preferences,
            'contact', v_share.contact,
            'memo', v_share.memo,
            'percent', v_share.progress_percent,
            'view_count', v_share.view_count + 1,
            'created_at', v_share.created_at
        )
    );
END; 
$$;

-- =============================================
-- 공유 생성/삭제 RPC
-- =============================================

CREATE OR REPLACE FUNCTION public.create_journey_share(
  p_preferences TEXT[],
  p_contact TEXT,
  p_memo TEXT,
  p_percent INTEGER,
  p_password TEXT
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$ 
DECLARE 
    v_user_id TEXT;
    v_token TEXT;
    v_share_id UUID;
BEGIN 
    -- 사용자 ID 확인
    v_user_id := auth.jwt() ->> 'sub';
    
    IF v_user_id IS NULL THEN 
        RETURN jsonb_build_object('error', '로그인이 필요합니다.');
    END IF;

    -- 고유 토큰 생성 (8자리 랜덤 문자열)
    v_token := substring(md5(random()::text || clock_timestamp()::text) from 1 for 8);

    -- 공유 데이터 저장
    INSERT INTO public.user_shares (
        user_id,
        share_token,
        share_password,
        preferences,
        contact,
        memo,
        progress_percent
    ) VALUES (
        v_user_id,
        v_token,
        p_password,
        p_preferences,
        p_contact,
        p_memo,
        p_percent
    )
    RETURNING id INTO v_share_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'share_token', v_token,
        'share_id', v_share_id
    );
END; 
$$;

-- 공유 비활성화 (삭제 대신 비활성화)
CREATE OR REPLACE FUNCTION public.deactivate_journey_share(p_token TEXT)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$ 
DECLARE 
    v_user_id TEXT;
    v_updated INTEGER;
BEGIN 
    v_user_id := auth.jwt() ->> 'sub';
    
    IF v_user_id IS NULL THEN 
        RETURN jsonb_build_object('error', '로그인이 필요합니다.');
    END IF;

    UPDATE public.user_shares 
    SET is_active = FALSE 
    WHERE share_token = p_token 
    AND user_id = v_user_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN 
        RETURN jsonb_build_object('error', '공유를 찾을 수 없거나 권한이 없습니다.');
    END IF;

    RETURN jsonb_build_object('success', TRUE);
END; 
$$;

COMMIT;
