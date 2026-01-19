-- Fix RLS policies for partner_inquiries table and partner_docs storage

-- ============================================
-- 1. partner_inquiries 테이블 RLS 정책
-- ============================================

-- Enable RLS
ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON partner_inquiries;
DROP POLICY IF EXISTS "Enable select for all users" ON partner_inquiries;
DROP POLICY IF EXISTS "Enable select for own submissions" ON partner_inquiries;

-- Allow authenticated users to submit partner applications
CREATE POLICY "Enable insert for authenticated users" 
ON partner_inquiries FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own submissions
CREATE POLICY "Enable select for own submissions" 
ON partner_inquiries FOR SELECT 
USING (auth.uid()::text = user_id);

-- Allow super admins to view all
CREATE POLICY "Enable select for admins" 
ON partner_inquiries FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM super_admins 
        WHERE id = auth.uid()::text
    )
);

-- ============================================
-- 2. partner_docs Storage Bucket 정책
-- ============================================

-- Storage bucket policies (Supabase Dashboard에서 실행)
-- Bucket: partner_docs

-- INSERT (Upload) Policy
-- Name: "Allow authenticated users to upload"
-- Policy: (bucket_id = 'partner_docs')
-- WITH CHECK: true

-- SELECT (Download) Policy  
-- Name: "Allow public read"
-- Policy: (bucket_id = 'partner_docs')
-- USING: true

-- Reload schema
NOTIFY pgrst, 'reload schema';
