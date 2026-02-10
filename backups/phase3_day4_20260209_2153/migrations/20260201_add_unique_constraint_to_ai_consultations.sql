-- 20260201_add_unique_constraint_to_ai_consultations.sql
-- conversation_id에 유니크 제약 조건을 추가하여 ON CONFLICT upsert 지원

-- 1. 중복 데이터 정리 (혹시 모를 중복 방지 - 가장 최근 것만 남김)
DELETE FROM public.ai_consultations a
USING public.ai_consultations b
WHERE a.id < b.id 
  AND a.conversation_id = b.conversation_id;

-- 2. 유니크 제약 조건 추가
ALTER TABLE public.ai_consultations 
DROP CONSTRAINT IF EXISTS ai_consultations_conversation_id_key;

ALTER TABLE public.ai_consultations 
ADD CONSTRAINT ai_consultations_conversation_id_key UNIQUE (conversation_id);

-- 3. 확인
COMMENT ON COLUMN public.ai_consultations.conversation_id IS 'Unique identifier for the AI chat session, used for recovery and status tracking.';
