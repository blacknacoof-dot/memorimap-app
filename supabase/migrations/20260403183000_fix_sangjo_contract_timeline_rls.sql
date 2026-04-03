-- ============================================================
-- sangjo_contract_timeline RLS fix
-- ============================================================
-- Problem:
-- - AI sangjo consultation now calls addTimelineEvent() after contract creation.
-- - The live DB rejects INSERT on sangjo_contract_timeline for authenticated users.
-- - Result: contract save succeeds but timeline history is silently dropped.
--
-- Policy intent:
-- - INSERT: allow authenticated users only when the referenced contract exists.
--   This matches the current sangjo_contracts model, where contract creation itself
--   is allowed for authenticated users.
-- - SELECT/UPDATE/DELETE: restrict to the linked sangjo admin or super admin.
-- ============================================================

ALTER TABLE IF EXISTS public.sangjo_contract_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sangjo_contract_timeline_select" ON public.sangjo_contract_timeline;
DROP POLICY IF EXISTS "sangjo_contract_timeline_insert" ON public.sangjo_contract_timeline;
DROP POLICY IF EXISTS "sangjo_contract_timeline_update" ON public.sangjo_contract_timeline;
DROP POLICY IF EXISTS "sangjo_contract_timeline_delete" ON public.sangjo_contract_timeline;
DROP POLICY IF EXISTS "sangjo_contract_timeline_select_v2" ON public.sangjo_contract_timeline;
DROP POLICY IF EXISTS "sangjo_contract_timeline_insert_v2" ON public.sangjo_contract_timeline;
DROP POLICY IF EXISTS "sangjo_contract_timeline_update_v2" ON public.sangjo_contract_timeline;
DROP POLICY IF EXISTS "sangjo_contract_timeline_delete_v2" ON public.sangjo_contract_timeline;

CREATE POLICY "sangjo_contract_timeline_select_v2"
  ON public.sangjo_contract_timeline FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.sangjo_contracts sc
      JOIN public.sangjo_hq_admins sha
        ON sha.sangjo_id = sc.sangjo_id
      WHERE sc.contract_number = sangjo_contract_timeline.contract_number
        AND sha.user_id::text = public.clerk_user_id()
    )
  );

CREATE POLICY "sangjo_contract_timeline_insert_v2"
  ON public.sangjo_contract_timeline FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.sangjo_contracts sc
      WHERE sc.contract_number = sangjo_contract_timeline.contract_number
    )
  );

CREATE POLICY "sangjo_contract_timeline_update_v2"
  ON public.sangjo_contract_timeline FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.sangjo_contracts sc
      JOIN public.sangjo_hq_admins sha
        ON sha.sangjo_id = sc.sangjo_id
      WHERE sc.contract_number = sangjo_contract_timeline.contract_number
        AND sha.user_id::text = public.clerk_user_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.sangjo_contracts sc
      JOIN public.sangjo_hq_admins sha
        ON sha.sangjo_id = sc.sangjo_id
      WHERE sc.contract_number = sangjo_contract_timeline.contract_number
        AND sha.user_id::text = public.clerk_user_id()
    )
  );

CREATE POLICY "sangjo_contract_timeline_delete_v2"
  ON public.sangjo_contract_timeline FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.sangjo_contracts sc
      JOIN public.sangjo_hq_admins sha
        ON sha.sangjo_id = sc.sangjo_id
      WHERE sc.contract_number = sangjo_contract_timeline.contract_number
        AND sha.user_id::text = public.clerk_user_id()
    )
  );
