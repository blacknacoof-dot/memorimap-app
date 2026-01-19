-- Fix partner_inquiries.user_id column type from UUID to TEXT for Clerk compatibility

-- Step 1: Drop ALL policies on partner_inquiries table (dynamic deletion)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'partner_inquiries'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON partner_inquiries';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 2: Change user_id column type
ALTER TABLE partner_inquiries 
ALTER COLUMN user_id TYPE TEXT;

-- Step 3: Recreate policies with TEXT type
CREATE POLICY "Enable insert for authenticated users" 
ON partner_inquiries FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable select for own submissions" 
ON partner_inquiries FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Enable select for admins" 
ON partner_inquiries FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM super_admins 
        WHERE id = auth.uid()::text
    )
);

-- Reload schema
NOTIFY pgrst, 'reload schema';
