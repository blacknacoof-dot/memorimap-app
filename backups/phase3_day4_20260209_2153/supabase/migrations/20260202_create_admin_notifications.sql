-- Create admin_notifications table for general inquiry super admin notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    user_id TEXT,
    inquiry_type TEXT,
    inquiry_text TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created 
    ON public.admin_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_status 
    ON public.admin_notifications(status);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert (for inquiry submissions)
CREATE POLICY "Anyone can insert notifications"
    ON public.admin_notifications
    FOR INSERT
    WITH CHECK (true);

-- Only authenticated users can view their own
CREATE POLICY "Users can view own notifications"
    ON public.admin_notifications
    FOR SELECT
    USING (auth.uid()::text = user_id);

COMMENT ON TABLE public.admin_notifications IS 'Stores general inquiry notifications for super admin review';
