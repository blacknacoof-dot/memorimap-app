
-- Check for invalid user_id or partner_id in partner_conversations
SELECT count(*) as invalid_conversations_user
FROM partner_conversations 
WHERE user_id IS NOT NULL 
AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

SELECT count(*) as invalid_conversations_partner
FROM partner_conversations 
WHERE partner_id IS NOT NULL 
AND partner_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Check for invalid user_id in partner_inquiries
SELECT count(*) as invalid_inquiries_user
FROM partner_inquiries 
WHERE user_id IS NOT NULL 
AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
