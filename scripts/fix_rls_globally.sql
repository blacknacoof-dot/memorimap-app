-- 1. bot_data Table (Admin Only)
-- This table relies on 'role' claim, which is standard. No changes strictly needed if 'role' is in metadata, 
-- but using auth.jwt() ->> 'role' is safer with custom tokens.

CREATE TABLE IF NOT EXISTS public.bot_data (
    id SERIAL PRIMARY KEY,
    faq JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bot_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Admins can do everything on bot_data" ON public.bot_data;
DROP POLICY IF EXISTS "Public can read bot_data" ON public.bot_data;

-- Policy: Admin Access
-- Support both metadata role (standard) and custom claim role (Clerk template)
CREATE POLICY "Admins can do everything on bot_data" ON public.bot_data
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role' = 'admin') OR 
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') OR
        auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
    )
    WITH CHECK (
        (auth.jwt() ->> 'role' = 'admin') OR 
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') OR
        auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Public can read bot_data" ON public.bot_data
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 2. memorial_spaces Table (Owner Access)
-- CRITICAL: Match owner_user_id (Text) against 'clerk_id' (Text) from JWT
-- DO NOT use auth.uid() because it returns a UUID (Subject).

-- (Optional) Enable RLS if not already
ALTER TABLE public.memorial_spaces ENABLE ROW LEVEL SECURITY;

-- Drop old owner policy if exists
DROP POLICY IF EXISTS "Owners can update their facilities" ON public.memorial_spaces;

CREATE POLICY "Owners can update their facilities" ON public.memorial_spaces
    FOR UPDATE
    TO authenticated
    USING (
        owner_user_id = (auth.jwt() ->> 'clerk_id') -- Matches Clerk ID (text)
    )
    WITH CHECK (
        owner_user_id = (auth.jwt() ->> 'clerk_id')
    );

-- 3. Users Table (Self Access)
-- Ensure users can only read/update their own data
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        clerk_id = (auth.jwt() ->> 'clerk_id')
    )
    WITH CHECK (
        clerk_id = (auth.jwt() ->> 'clerk_id')
    );
