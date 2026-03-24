BEGIN;

UPDATE public.profiles
SET clerk_id = id::text
WHERE clerk_id IS NULL;

CREATE OR REPLACE FUNCTION public.sync_profile_identity_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS NOT NULL AND (NEW.clerk_id IS NULL OR NEW.clerk_id = '') THEN
    NEW.clerk_id := NEW.id::text;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_profile_identity_columns ON public.profiles;
CREATE TRIGGER trigger_sync_profile_identity_columns
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_identity_columns();

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_clerk_id_unique
ON public.profiles (clerk_id)
WHERE clerk_id IS NOT NULL;

COMMIT;
