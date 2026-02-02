-- Fix consultations table schema conflict
-- Issue: Two different consultations table definitions exist:
--   1. 20260106_consultations_schema.sql: user_id (TEXT), facility_id (UUID) 
--   2. 20260202_sangjo_chat_events.sql: partner_id (TEXT), no facility_id
--
-- Solution: Drop the duplicate from sangjo_chat_events and keep the original schema

-- Drop duplicate consultations table from sangjo migration
DROP TABLE IF EXISTS public.consultations CASCADE;

-- Recreate with correct schema (from 20260106)
CREATE TABLE public.consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    user_name TEXT,
    user_phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for AI chat)
CREATE POLICY "Enable insert for all users" ON public.consultations 
FOR INSERT WITH CHECK (true);

-- Allow users to view their own consultations
CREATE POLICY "Users can view own consultations" ON public.consultations
FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Allow facility admins to view consultations for their facility
CREATE POLICY "Facility admins can view facility consultations" ON public.consultations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.facilities 
        WHERE facilities.id = consultations.facility_id 
        AND facilities.user_id = auth.jwt() ->> 'sub'
    )
);

-- Allow super admins to view all
CREATE POLICY "Super admins can view all consultations" ON public.consultations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.clerk_id = auth.jwt() ->> 'sub'
        AND profiles.role = 'super_admin'
    )
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_consultations_user ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_facility ON public.consultations(facility_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);

-- Add updated_at trigger
CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON public.consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
