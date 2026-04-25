BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_facility_sensitive_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_super_admin() OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.verified, false)
      OR NEW.status IN ('active', 'approved', 'verified')
      OR NEW.price_range IS NOT NULL
    THEN
      RAISE EXCEPTION 'Only super admins can create facilities with verification, active status, or price range.';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.verified IS DISTINCT FROM OLD.verified
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.price_range IS DISTINCT FROM OLD.price_range
    THEN
      RAISE EXCEPTION 'Only super admins can update facility verification, status, or price range.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_facility_sensitive_updates ON public.facilities;

CREATE TRIGGER enforce_facility_sensitive_updates
BEFORE INSERT OR UPDATE ON public.facilities
FOR EACH ROW
EXECUTE FUNCTION public.enforce_facility_sensitive_updates();

COMMIT;
