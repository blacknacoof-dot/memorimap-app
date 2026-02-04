-- =============================================
-- 엔딩 노트 RLS 보안 정책 강화 (Genius Patch V8)
-- =============================================

-- 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "ending_notes_select" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_insert" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_update" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_all" ON public.user_ending_notes;

-- 모든 작업(ALL)을 하나의 강력한 정책으로 통합하여 Upsert 안정성 확보
-- 10x Dev Tip: Upsert는 INSERT와 UPDATE 권한이 모두 필요하며, 존재 여부 확인을 위해 SELECT도 필요합니다.
-- 'ALL' 정책은 이 모든 과정을 하나의 인증 흐름으로 묶어줍니다.
CREATE POLICY "ending_notes_owner_all" 
ON public.user_ending_notes 
FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'sub' = user_id)
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- 검증용 로그 기록 권한 (필요 시)
ALTER TABLE public.user_journey_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journey_logs_all" ON public.user_journey_logs;
CREATE POLICY "journey_logs_owner_all" 
ON public.user_journey_logs 
FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'sub' = user_id)
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- 확인 메시지
DO $$ BEGIN RAISE NOTICE 'RLS 정책이 owner_all(FOR ALL)로 강화되었습니다.'; END $$;
