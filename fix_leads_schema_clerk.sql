-- ==========================================
-- Fix 'leads' Table Schema for Clerk (Text ID) Compatibility
-- ==========================================

-- 1. Drop existing RLS policies to avoid conflicts during type change
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.leads;
DROP POLICY IF EXISTS "Allow users to view own leads" ON public.leads;

-- 2. Modify user_id column type from UUID to TEXT
-- (Clerk IDs are strings like 'user_2xyz...', which cannot fit in UUID)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_user_id_fkey; -- Remove FK to auth.users
ALTER TABLE public.leads ALTER COLUMN user_id TYPE text USING user_id::text; -- Convert to TEXT

-- 3. Re-create RLS Policies with Text Comparison
-- Now both auth.uid() (from JWT) and user_id (column) are TEXT.

-- Policy: INSERT
CREATE POLICY "Allow authenticated insert"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure the user is inserting their own ID
  -- (If your app allows anonymous leads, remove the check or add 'auth.role() = anon')
  auth.uid()::text = user_id
);

-- Policy: SELECT
CREATE POLICY "Allow users to view own leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = user_id
);

-- 4. Grant Permissions (Ensure public/anon can't break things, but authenticated can work)
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
