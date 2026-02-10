
DO $$ 
DECLARE 
    constraint_record RECORD;
BEGIN
    -- Find and drop foreign key constraint on facility_id
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.consultations'::regclass 
        AND contype = 'f'
        AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.consultations'::regclass AND attname = 'facility_id')]
    LOOP
        EXECUTE 'ALTER TABLE public.consultations DROP CONSTRAINT ' || quote_ident(constraint_record.conname);
    END LOOP;
END $$;

-- Alter column to TEXT
ALTER TABLE public.consultations ALTER COLUMN facility_id TYPE text;
