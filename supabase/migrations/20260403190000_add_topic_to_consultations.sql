ALTER TABLE public.consultations
ADD COLUMN IF NOT EXISTS topic TEXT;
