-- Create bot_data table if not exists
CREATE TABLE IF NOT EXISTS public.bot_data (
    id SERIAL PRIMARY KEY,
    faq JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bot_data ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do anything (select, insert, update, delete)
CREATE POLICY "Admins can do everything on bot_data" ON public.bot_data
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'))
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- Policy: Public can read (for chatbot usage)
CREATE POLICY "Public can read bot_data" ON public.bot_data
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Insert initial empty row if not exists (to ensure strictly one config row for simple usage)
INSERT INTO public.bot_data (id, faq)
VALUES (1, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
