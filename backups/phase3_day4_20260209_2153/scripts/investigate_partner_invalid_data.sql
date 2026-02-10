
-- Inspect the invalid user_id values
SELECT *
FROM partner_inquiries
WHERE user_id IS NOT NULL 
AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
