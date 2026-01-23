-- 001_add_ai_columns.sql
-- [Final Verified Version]
-- Transaction 시작 (실패 시 전체 롤백)
BEGIN;

-- 1. 컬럼 추가 (존재하지 않을 경우에만 수행)
ALTER TABLE public.consultations 
ADD COLUMN IF NOT EXISTS is_ai_response BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS responder_id UUID;

-- 2. 기존 데이터 보정 (NULL 방지 및 기본값 적용)
-- 대량 데이터일 경우 배치 처리가 권장되나, 초기 스타트업 규모에서는 이 방식이 빠르고 확실함
UPDATE public.consultations SET is_ai_response = FALSE WHERE is_ai_response IS NULL;
UPDATE public.consultations SET metadata = '{}'::jsonb WHERE metadata IS NULL;
UPDATE public.consultations SET source = 'direct' WHERE source IS NULL;

-- 3. [안전장치] FK 연결 전, 유효하지 않은 responder_id 정리
-- (컬럼이 이미 존재하고 더미 데이터가 들어있을 경우를 대비한 방어 로직)
UPDATE public.consultations 
SET responder_id = NULL 
WHERE responder_id IS NOT NULL 
  AND responder_id NOT IN (SELECT id FROM auth.users);

-- 4. 외래키(FK) 제약조건 안전하게 추가
DO $$
BEGIN
    -- 제약조건이 없을 때만 추가
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_consultations_responder') THEN
        
        -- auth.users 테이블 존재 여부 확인 (Supabase 환경 보장)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
            ALTER TABLE public.consultations 
            ADD CONSTRAINT fk_consultations_responder 
            FOREIGN KEY (responder_id) REFERENCES auth.users(id);
        ELSE
            RAISE NOTICE '⚠️ auth.users table not found. Skipping FK.';
        END IF;

    END IF;
END $$;

COMMIT;

-- 5. 인덱스 생성 (트랜잭션 외부 실행)
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_is_ai_response ON public.consultations(is_ai_response);
CREATE INDEX IF NOT EXISTS idx_consultations_responder_id ON public.consultations(responder_id);
