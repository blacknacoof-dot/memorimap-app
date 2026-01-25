-- Create user_notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Clerk User ID
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    is_read BOOLEAN DEFAULT false,
    link TEXT, -- Optional link to navigate to
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications
    FOR SELECT TO authenticated
    USING (user_id = (auth.jwt() ->> 'sub'));

-- Users can mark their own notifications as read (update)
CREATE POLICY "Users can update own notifications" ON public.user_notifications
    FOR UPDATE TO authenticated
    USING (user_id = (auth.jwt() ->> 'sub'))
    WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- Service role can do everything (required for Edge Functions)
CREATE POLICY "Service role can manage all notifications" ON public.user_notifications
    USING (true)
    WITH CHECK (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
