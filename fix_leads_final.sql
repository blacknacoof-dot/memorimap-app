-- ==========================================
-- FINAL FIX for 'leads' Table (Schema & RLS)
-- ==========================================

-- 1. Change user_id to TEXT (to support Clerk IDs)
--    We handle the case where it might already be TEXT or UUID.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
          AND column_name = 'user_id' 
          AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_user_id_fkey;
        ALTER TABLE public.leads ALTER COLUMN user_id TYPE text USING user_id::text;
    END IF;
END $$;

-- 2. Reset RLS Policies
--    Drop strict policies that might be blocking access.
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.leads;
DROP POLICY IF EXISTS "Allow users to view own leads" ON public.leads;
DROP POLICY IF EXISTS "Allow anon insert" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert" ON public.leads;

-- 3. Policy: Allow Public Insert (Fixes 401/42501)
--    Allows ANYONE (Anonymous or Logged In) to insert a lead.
CREATE POLICY "Allow public insert"
ON public.leads
FOR INSERT
TO public
WITH CHECK (true);

-- 4. Policy: Allow Public Select (TEMPORARY DEV FIX)
--    Allows reading leads. Required because .select() after insert fails if Identity (Clerk) != Supabase Auth.
--    NOTE: In production, consider using a Security Definer RPC for creating leads instead of direct insert + RLS.
CREATE POLICY "Allow public select"
ON public.leads
FOR SELECT
TO public
USING (true);

-- 5. Grant Permissions (Crucial for 401 error resolution)
GRANT ALL ON public.leads TO anon;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
