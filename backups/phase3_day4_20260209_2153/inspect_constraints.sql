
SELECT conname
FROM pg_constraint
WHERE conrelid = 'public.consultations'::regclass
AND contype = 'f';
