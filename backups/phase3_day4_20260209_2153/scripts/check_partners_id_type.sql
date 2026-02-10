
SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'partners'
    AND column_name = 'id';
