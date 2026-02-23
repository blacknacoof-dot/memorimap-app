-- Normalize existing 'pending' values to 'waiting'
UPDATE consultations SET status = 'waiting' WHERE status = 'pending';

-- Add CHECK constraint to prevent future 'pending' inserts
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_status_check;
ALTER TABLE consultations ADD CONSTRAINT consultations_status_check
  CHECK (status IN ('waiting', 'accepted', 'cancelled', 'completed'));
