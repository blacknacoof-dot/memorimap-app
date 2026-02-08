
BEGIN;

-- =================================================================
-- 1. DROP EXISTING POLICIES & CONSTRAINTS (Blocking Migration)
-- =================================================================

-- 1.1 Drop Policies
DROP POLICY IF EXISTS "Public partners are viewable by everyone" ON partners;
DROP POLICY IF EXISTS "Anyone can view their own conversations" ON partner_conversations;
DROP POLICY IF EXISTS "Users can start conversations" ON partner_conversations;
DROP POLICY IF EXISTS "Users/Partners can insert their own conversations" ON partner_conversations;
DROP POLICY IF EXISTS "super_admin_manage_partner_operations" ON partner_operations;

-- 1.2 Drop Foreign Key Constraints
ALTER TABLE partner_conversations DROP CONSTRAINT IF EXISTS partner_conversations_partner_id_fkey;
ALTER TABLE partner_operations DROP CONSTRAINT IF EXISTS partner_operations_partner_id_fkey;

-- =================================================================
-- 2. DATA CLEANUP & PREPARATION
-- =================================================================

-- 2.1 Map Clerk ID to Profile UUID in partner_conversations
UPDATE partner_conversations pc
SET user_id = p.id::text
FROM profiles p
WHERE pc.user_id = p.clerk_id;

-- 2.2 Delete Invalid/Test/Legacy Data
-- partner_conversations
DELETE FROM partner_conversations
WHERE (user_id IS NOT NULL AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
   OR (partner_id IS NOT NULL AND partner_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- partner_operations
DELETE FROM partner_operations
WHERE partner_id IS NOT NULL 
AND partner_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- partners
DELETE FROM partners
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- =================================================================
-- 3. MIGRATE COLUMNS TO UUID
-- =================================================================

-- Partners
ALTER TABLE partners
ALTER COLUMN id TYPE uuid USING id::uuid;

-- Partner Conversations
ALTER TABLE partner_conversations
ALTER COLUMN id TYPE uuid USING id::uuid;
ALTER TABLE partner_conversations
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE partner_conversations
ALTER COLUMN partner_id TYPE uuid USING partner_id::uuid;

-- Partner Operations
ALTER TABLE partner_operations
ALTER COLUMN partner_id TYPE uuid USING partner_id::uuid;

-- =================================================================
-- 4. RESTORE FOREIGN KEYS
-- =================================================================

-- partner_conversations -> profiles
ALTER TABLE partner_conversations
ADD CONSTRAINT fk_partner_conversations_profile
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- partner_conversations -> partners
ALTER TABLE partner_conversations
ADD CONSTRAINT fk_partner_conversations_partner
FOREIGN KEY (partner_id) REFERENCES partners(id);

-- partner_operations -> partners
ALTER TABLE partner_operations
ADD CONSTRAINT fk_partner_operations_partner
FOREIGN KEY (partner_id) REFERENCES partners(id);

-- =================================================================
-- 5. RE-CREATE RLS POLICIES
-- =================================================================

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_operations ENABLE ROW LEVEL SECURITY;

-- 5.1 Partners: Public Read
CREATE POLICY "partners_select_public"
ON partners FOR SELECT
TO public
USING (true);

-- 5.2 Partner Conversations: Standard Access
CREATE POLICY "partner_conversations_select_own"
ON partner_conversations FOR SELECT
TO authenticated
USING (
  user_id = (auth.jwt() ->> 'sub')::uuid
);

CREATE POLICY "partner_conversations_insert_authenticated"
ON partner_conversations FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (auth.jwt() ->> 'sub')::uuid
);

CREATE POLICY "partner_conversations_manage_admin"
ON partner_conversations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = (auth.jwt() ->> 'sub')::uuid
      AND p.role IN ('super_admin', 'sangjo_manager')
  )
);

-- 5.3 Partner Operations: Admin Only
CREATE POLICY "partner_operations_manage_admin"
ON partner_operations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = (auth.jwt() ->> 'sub')::uuid
      AND p.role IN ('super_admin', 'sangjo_manager')
  )
);

COMMIT;
