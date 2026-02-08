-- =============================================
-- HOTFIX: Fix user_notifications 400 Bad Request
-- =============================================
-- Cause: user_id column might be UUID type while Clerk IDs are TEXT.
-- Solution: Force user_id to TEXT and reset RLS policies.

BEGIN;

-- 1. Table schema correction
-- We need to change the column type to TEXT if it's currently UUID.
-- To do this safely, we might need to drop and re-create if there are dependencies, 
-- but usually a straight ALTER works if there are no FK constraints.
DO $$ 
BEGIN 
    -- Change column type to TEXT if it's not already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_notifications' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.user_notifications ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    END IF;

    -- Ensure the table exists (fallback if migration was never run successfully)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_notifications') THEN
        CREATE TABLE public.user_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            is_read BOOLEAN DEFAULT false,
            link TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    END IF;
END $$;

-- 2. Reset RLS Policies
-- Wipe all existing policies to avoid conflicts or recursion
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_notifications' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.user_notifications';
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Apply robust policies using current_setting (stable with Clerk)
CREATE POLICY "user_notifications_select" ON public.user_notifications
    FOR SELECT TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

CREATE POLICY "user_notifications_update" ON public.user_notifications
    FOR UPDATE TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'))
    WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- Service role access for backend/edge functions
CREATE POLICY "service_role_manage_notifications" ON public.user_notifications
    USING (true)
    WITH CHECK (true);

-- 3. Permissions
GRANT ALL ON public.user_notifications TO authenticated, service_role;
GRANT SELECT ON public.user_notifications TO anon;

COMMIT;

SELECT 'Hotfix for user_notifications completed. Please test now.' as message;
