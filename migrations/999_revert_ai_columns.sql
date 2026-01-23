-- 999_revert_ai_columns.sql
-- [주의] 실행 시 is_ai_response, metadata, responder_id, source 컬럼과 데이터가 영구 삭제됩니다.

ALTER TABLE public.consultations 
DROP COLUMN IF EXISTS is_ai_response,
DROP COLUMN IF EXISTS metadata,
DROP COLUMN IF EXISTS responder_id,
DROP COLUMN IF EXISTS source;
