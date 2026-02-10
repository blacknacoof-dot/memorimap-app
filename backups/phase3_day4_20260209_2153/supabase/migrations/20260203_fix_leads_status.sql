-- Fix for 'leads_status_check' violation error (23514)
-- The 'create_consultation_from_lead' RPC sets status to 'handed_over', 
-- but the original constraint did not include this value.

DO $$ 
BEGIN
    -- 1. Drop existing constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_status_check'
    ) THEN
        ALTER TABLE public.leads DROP CONSTRAINT leads_status_check;
    END IF;

    -- 2. Add updated constraint including 'handed_over'
    ALTER TABLE public.leads ADD CONSTRAINT leads_status_check 
    CHECK (status IN ('new', 'contacted', 'converting', 'closed', 'rejected', 'handed_over'));
END $$;
