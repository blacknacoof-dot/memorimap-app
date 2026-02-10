-- Check RLS policies for facility_reviews
SELECT * FROM pg_policies WHERE tablename = 'facility_reviews';

-- Check table definition
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'facility_reviews';
