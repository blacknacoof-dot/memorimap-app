-- Check partner_conversations table schema
-- Run this to verify column names before applying RLS policies

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'partner_conversations'
ORDER BY ordinal_position;
