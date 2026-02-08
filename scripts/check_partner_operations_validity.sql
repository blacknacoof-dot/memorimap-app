
-- Check for invalid partner_id in partner_operations
SELECT count(*) as invalid_operations_partner_id
FROM partner_operations
WHERE partner_id IS NOT NULL 
AND partner_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Show samples if any
SELECT id, partner_id FROM partner_operations 
WHERE partner_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
LIMIT 5;
