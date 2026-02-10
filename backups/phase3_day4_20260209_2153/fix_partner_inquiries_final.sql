-- 1. Ensure table exists (safe to run)
CREATE TABLE IF NOT EXISTS partner_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    company_name TEXT,
    company_phone TEXT,
    type TEXT,
    business_type TEXT,
    contact_person TEXT,
    manager_name TEXT,
    manager_position TEXT,
    contact_number TEXT,
    phone TEXT,
    manager_mobile TEXT,
    company_email TEXT,
    email TEXT,
    address TEXT,
    business_license_url TEXT,
    message TEXT,
    privacy_consent BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    target_facility_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

-- 3. Fix INSERT Policy: Allow any authenticated user to insert
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON partner_inquiries;
CREATE POLICY "Enable insert for authenticated users"
ON partner_inquiries FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Fix SELECT Policy: Allow users to see their own data
-- Uses auth.jwt() ->> 'sub' to safely handle Clerk IDs (text) instead of auth.uid() (uuid)
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON partner_inquiries;
DROP POLICY IF EXISTS "Enable select for own inquiries" ON partner_inquiries; -- Clean up potential old name

CREATE POLICY "Enable select for users based on user_id"
ON partner_inquiries FOR SELECT
TO authenticated
USING (user_id = (select auth.jwt() ->> 'sub'));
