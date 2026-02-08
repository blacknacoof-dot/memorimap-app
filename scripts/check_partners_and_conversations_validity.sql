
-- Check proper UUID format for partners table
SELECT count(*) as invalid_partners_id
FROM partners
WHERE id IS NOT NULL 
AND id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Check related columns in partner_conversations
SELECT count(*) as invalid_conversations_partner_id
FROM partner_conversations
WHERE partner_id IS NOT NULL 
AND partner_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

SELECT count(*) as invalid_conversations_user_id
FROM partner_conversations
WHERE user_id IS NOT NULL 
AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Show samples if any
SELECT id as invalid_partner_id_sample FROM partners 
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
LIMIT 5;
