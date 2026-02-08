-- Check columns for tables involved in RLS script
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN (
    'consultations', 
    'facility_reviews', 
    'super_admins', 
    'admin_users', 
    'facility_admins', 
    'sangjo_hq_admins', 
    'sangjo_dashboard_users',
    'subscription_payments'
  )
  AND (column_name LIKE '%id%' OR column_name LIKE '%user%')
ORDER BY table_name, column_name;
