-- ==========================================
-- Fix 42501 Error (RLS Policy Violation) for 'leads' table
-- ==========================================
-- [Strategy] Use TEXT comparison to avoid UUID/Text mismatch errors
-- regardless of column definition.

-- 1. Ensure 'leads' table exists (Idempotent)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    contact_name TEXT,
    contact_phone TEXT,
    category TEXT,
    urgency TEXT,
    scale TEXT,
    priorities TEXT[],
    context_data JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow INSERT for Authenticated Users (Strict Check)
-- Validates that the inserted user_id matches the authenticated user (as text)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.leads;
CREATE POLICY "Allow authenticated insert"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid()::text = user_id::text
);

-- 4. Policy: Allow Users to View Their Own Leads (Text Comparison Fix)
-- Fixes 'operator does not exist: uuid = text' by casting both to text
DROP POLICY IF EXISTS "Allow users to view own leads" ON public.leads;
CREATE POLICY "Allow users to view own leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = user_id::text
);

-- 5. Grant Permissions
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
