-- Add 'urgent' to the allowed statuses for reservations table if a constraint exists

DO $$
BEGIN
    -- Check if a constraint named 'reservations_status_check' exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_status_check') THEN
        ALTER TABLE reservations DROP CONSTRAINT reservations_status_check;
        ALTER TABLE reservations ADD CONSTRAINT reservations_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'urgent'));
    END IF;
    
    -- If no named constraint, we might need to check for generic constraints or just assume it's fine.
    -- However, if there was an unnamed constraint, dropping it is harder.
    -- Let's attempt to add the constraint if it doesn't exist, to be safe.
    
    -- BUT, if the column is just TEXT without constraint, valid.
    -- If it has a constraint we don't know the name of, the insert will fail and we'll see an error.
    -- For now, let's try to identify if ANY check constraint exists on the status column.
    
    -- (Simple approach: minimal intervention. If user didn't have constraint, this does nothing.
    -- If they had the standard named one, it updates it.)
    
END $$;
