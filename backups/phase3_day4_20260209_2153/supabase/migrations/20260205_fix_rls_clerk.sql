BEGIN;

-- =============================================
-- RLS 정책 수정: Clerk JWT 호환성 개선
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "ending_notes_select" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_insert" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_update" ON public.user_ending_notes;
DROP POLICY IF EXISTS "ending_notes_delete" ON public.user_ending_notes;

DROP POLICY IF EXISTS "journey_logs_select" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_insert" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_update" ON public.user_journey_logs;
DROP POLICY IF EXISTS "journey_logs_delete" ON public.user_journey_logs;

-- =============================================
-- user_ending_notes RLS 정책 (Clerk JWT 지원)
-- =============================================

-- SELECT: 사용자는 자신의 데이터만 볼 수 있음
CREATE POLICY "ending_notes_select_v2" ON public.user_ending_notes
FOR SELECT 
USING (
    -- Clerk JWT (sub 클레임) 또는 Supabase Auth (uid) 지원
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

-- INSERT: 사용자는 자신의 데이터만 삽입 가능
CREATE POLICY "ending_notes_insert_v2" ON public.user_ending_notes
FOR INSERT 
WITH CHECK (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

-- UPDATE: 사용자는 자신의 데이터만 수정 가능
CREATE POLICY "ending_notes_update_v2" ON public.user_ending_notes
FOR UPDATE 
USING (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
)
WITH CHECK (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

-- user_ending_notes는 DELETE 정책이 필요 없음 (upsert만 사용)

-- =============================================
-- user_journey_logs RLS 정책 (Clerk JWT 지원)
-- =============================================

-- SELECT
CREATE POLICY "journey_logs_select_v2" ON public.user_journey_logs
FOR SELECT 
USING (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

-- INSERT
CREATE POLICY "journey_logs_insert_v2" ON public.user_journey_logs
FOR INSERT 
WITH CHECK (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

-- UPDATE
CREATE POLICY "journey_logs_update_v2" ON public.user_journey_logs
FOR UPDATE 
USING (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
)
WITH CHECK (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

-- DELETE
CREATE POLICY "journey_logs_delete_v2" ON public.user_journey_logs
FOR DELETE 
USING (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

-- =============================================
-- user_shares RLS 정책 (Clerk JWT 지원)
-- =============================================

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "shares_owner_all" ON public.user_shares;

-- SELECT
CREATE POLICY "shares_select_v2" ON public.user_shares
FOR SELECT 
USING (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

-- INSERT
CREATE POLICY "shares_insert_v2" ON public.user_shares
FOR INSERT 
WITH CHECK (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

-- UPDATE
CREATE POLICY "shares_update_v2" ON public.user_shares
FOR UPDATE 
USING (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
)
WITH CHECK (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

-- DELETE
CREATE POLICY "shares_delete_v2" ON public.user_shares
FOR DELETE 
USING (
    COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        auth.uid()::text
    ) = user_id
);

COMMIT;
