SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name IN ('partner_conversations', 'partner_inquiries', 'subscription_payments', 'user_notifications')
ORDER BY 
    table_name, ordinal_position;

SELECT * FROM pg_extension WHERE extname = 'postgis';

SELECT * FROM pg_policies 
WHERE tablename IN ('partner_conversations', 'partner_inquiries', 'subscription_payments', 'user_notifications');
