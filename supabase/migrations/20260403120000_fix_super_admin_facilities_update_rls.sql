BEGIN;

DROP POLICY IF EXISTS "facilities_super_admin_update" ON public.facilities;

CREATE POLICY "facilities_super_admin_update"
ON public.facilities
FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

COMMIT;
