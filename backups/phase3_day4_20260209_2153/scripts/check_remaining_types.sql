
-- 1. Check Types for Profiles and Partner Conversations
SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name 
FROM 
    information_schema.columns 
WHERE 
    table_name IN ('profiles', 'partner_conversations')
    AND column_name IN ('id', 'user_id', 'partner_id');

-- 2. Verify Reservations Policies exists after recreation
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'reservations';
