BEGIN;

DROP VIEW IF EXISTS public.admin_subscriptions_with_facility;

CREATE VIEW public.admin_subscriptions_with_facility
WITH (security_invoker = true)
AS
SELECT
  fs.*,
  COALESCE(f_by_uuid.name, f_by_legacy.name) AS facility_name
FROM public.facility_subscriptions fs
LEFT JOIN public.facilities f_by_uuid
  ON COALESCE(fs.facility_id_uuid, fs.facility_id) = f_by_uuid.id
LEFT JOIN public.facilities f_by_legacy
  ON fs.facility_id_bigint IS NOT NULL
 AND f_by_legacy.legacy_id = fs.facility_id_bigint;

GRANT SELECT ON public.admin_subscriptions_with_facility TO authenticated;
GRANT SELECT ON public.admin_subscriptions_with_facility TO service_role;

COMMIT;
