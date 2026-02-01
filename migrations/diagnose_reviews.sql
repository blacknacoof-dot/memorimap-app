-- [Diagnostic Script] Review Deletion Failure Analysis
-- Run this in your Supabase SQL Editor to dump table info

-- 1. Check table columns specifically for 'active' status and 'user_id' type
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'facility_reviews';

-- 2. List all RLS policies on the table
SELECT polname, polcmd, polroles, pg_get_expr(polqual, polrelid) as policy_using, pg_get_expr(polwithcheck, polrelid) as policy_check
FROM pg_policy
WHERE polrelid = 'public.facility_reviews'::regclass;

-- 3. Check for any Triggers that might prevent deletion/update
SELECT trigger_name, event_manipulation, action_statement, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'facility_reviews';

-- 4. Check Constraint (Foreign Keys)
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'public.facility_reviews'::regclass;
