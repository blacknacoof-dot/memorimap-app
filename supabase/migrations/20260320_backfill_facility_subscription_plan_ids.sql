-- ============================================================
-- 20260320_backfill_facility_subscription_plan_ids.sql
-- facility_subscriptions.plan_id canonical backfill
-- ============================================================

WITH normalized AS (
  SELECT
    fs.id,
    fs.plan_id,
    regexp_replace(lower(COALESCE(fs.plan_id, '')), '[\s-]+', '_', 'g') AS source_norm,
    sp.name_en AS matched_name_en
  FROM public.facility_subscriptions fs
  LEFT JOIN public.subscription_plans sp
    ON sp.id::text = fs.plan_id
)
UPDATE public.facility_subscriptions fs
SET
  plan_id = CASE
    WHEN n.source_norm IN ('sj_starter', 'sjstarter', '상조_starter') THEN 'sj_starter'
    WHEN n.source_norm IN ('sj_professional', 'sjprofessional', '상조_professional') THEN 'sj_professional'
    WHEN n.source_norm IN ('sj_enterprise', 'sjenterprise', '상조_enterprise') THEN 'sj_enterprise'
    WHEN n.matched_name_en IS NOT NULL THEN lower(regexp_replace(n.matched_name_en, '[\s-]+', '_', 'g'))
    ELSE fs.plan_id
  END,
  updated_at = NOW()
FROM normalized n
WHERE fs.id = n.id
  AND (
    n.source_norm IN ('sj_starter', 'sjstarter', '상조_starter')
    OR n.source_norm IN ('sj_professional', 'sjprofessional', '상조_professional')
    OR n.source_norm IN ('sj_enterprise', 'sjenterprise', '상조_enterprise')
    OR n.matched_name_en IS NOT NULL
  )
  AND fs.plan_id IS DISTINCT FROM CASE
    WHEN n.source_norm IN ('sj_starter', 'sjstarter', '상조_starter') THEN 'sj_starter'
    WHEN n.source_norm IN ('sj_professional', 'sjprofessional', '상조_professional') THEN 'sj_professional'
    WHEN n.source_norm IN ('sj_enterprise', 'sjenterprise', '상조_enterprise') THEN 'sj_enterprise'
    WHEN n.matched_name_en IS NOT NULL THEN lower(regexp_replace(n.matched_name_en, '[\s-]+', '_', 'g'))
    ELSE fs.plan_id
  END;
