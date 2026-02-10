
SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name 
FROM 
    information_schema.columns 
WHERE 
    table_name IN ('partner_conversations', 'partner_inquiries')
    AND column_name IN ('id', 'user_id', 'partner_id');
