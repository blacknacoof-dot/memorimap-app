import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type SupabaseAdmin = ReturnType<typeof createClient>;

type PersistOptions = {
  billingKey?: string | null;
  autoRenew?: boolean;
  paymentMethod?: string;
};

function oneMonthLater(base: Date): Date {
  const next = new Date(base);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export function normalizePlanId(planId: string): string {
  return planId.trim().replace(/[\s-]+/g, "_").toUpperCase();
}

export async function persistFacilitySubscription(
  db: SupabaseAdmin,
  params: {
    facilityId: string;
    planId: string;
    portonePaymentId: string;
    amount: number;
  } & PersistOptions,
): Promise<{ persisted: boolean; error?: string; subscriptionId?: string }> {
  const normalizedPlanId = normalizePlanId(params.planId);
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.facilityId);
  const now = new Date();
  const nextBilling = oneMonthLater(now);

  try {
    const { data: existingPayment } = await db
      .from("subscription_payments")
      .select("id, subscription_id")
      .eq("portone_payment_id", params.portonePaymentId)
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      return { persisted: true, subscriptionId: existingPayment.subscription_id ?? undefined };
    }

    const filterCol = isUUID ? "facility_id_uuid" : "facility_id_bigint";
    const filterVal = isUUID ? params.facilityId : Number(params.facilityId);

    const { data: existing } = await db
      .from("facility_subscriptions")
      .select(
        "id, plan_id, status, next_billing_date, billing_cycle, billing_key, billing_key_issued_at, retry_count, last_payment_error, cancel_at_period_end, cancelled_at, cancelled_reason, auto_renew",
      )
      .eq(filterCol, filterVal)
      .limit(1)
      .maybeSingle();

    const previousState = existing
      ? {
        plan_id: existing.plan_id,
        status: existing.status,
        next_billing_date: existing.next_billing_date,
        billing_cycle: existing.billing_cycle,
        billing_key: existing.billing_key,
        billing_key_issued_at: existing.billing_key_issued_at,
        retry_count: existing.retry_count,
        last_payment_error: existing.last_payment_error,
        cancel_at_period_end: existing.cancel_at_period_end,
        cancelled_at: existing.cancelled_at,
        cancelled_reason: existing.cancelled_reason,
        auto_renew: existing.auto_renew,
      }
      : null;

    const nextBillingDate = nextBilling.toISOString();
    const billingKeyIssuedAt = params.billingKey
      ? (existing?.billing_key_issued_at ?? now.toISOString())
      : existing?.billing_key_issued_at;

    const subscriptionData: Record<string, unknown> = {
      plan_id: normalizedPlanId,
      status: "active",
      next_billing_date: nextBillingDate,
      updated_at: now.toISOString(),
      billing_cycle: "monthly",
      retry_count: 0,
      last_payment_error: null,
      cancel_at_period_end: false,
      cancelled_at: null,
      cancelled_reason: null,
      auto_renew: params.autoRenew ?? (params.billingKey ? true : existing?.auto_renew ?? true),
    };

    if (params.billingKey) {
      subscriptionData.billing_key = params.billingKey;
      subscriptionData.billing_key_issued_at = billingKeyIssuedAt;
    }

    let subId: string | null = null;
    const wasInsert = !existing;

    if (existing) {
      const { data, error } = await db
        .from("facility_subscriptions")
        .update(subscriptionData)
        .eq("id", existing.id)
        .select("id")
        .single();

      if (error) return { persisted: false, error: `facility_subscriptions UPDATE: ${error.message}` };
      subId = data?.id;
    } else {
      if (isUUID) {
        subscriptionData.facility_id_uuid = params.facilityId;
      } else {
        subscriptionData.facility_id_bigint = Number(params.facilityId);
        subscriptionData.facility_id = Number(params.facilityId);
      }

      const { data, error } = await db
        .from("facility_subscriptions")
        .insert(subscriptionData)
        .select("id")
        .single();

      if (error) return { persisted: false, error: `facility_subscriptions INSERT: ${error.message}` };
      subId = data?.id;
    }

    if (subId && params.amount > 0) {
      const periodEnd = oneMonthLater(now);
      const { error: payError } = await db
        .from("subscription_payments")
        .insert({
          subscription_id: subId,
          payment_context: "facility",
          portone_payment_id: params.portonePaymentId,
          amount: params.amount,
          final_amount: params.amount,
          status: "completed",
          payment_method: params.paymentMethod ?? (params.billingKey ? "card_auto" : "card"),
          paid_at: now.toISOString(),
          billing_period_start: now.toISOString().split("T")[0],
          billing_period_end: periodEnd.toISOString().split("T")[0],
        });

      if (payError) {
        if (wasInsert) {
          await db.from("facility_subscriptions").delete().eq("id", subId);
        } else if (previousState) {
          await db.from("facility_subscriptions").update({
            plan_id: previousState.plan_id,
            status: previousState.status,
            next_billing_date: previousState.next_billing_date,
            billing_cycle: previousState.billing_cycle,
            billing_key: previousState.billing_key,
            billing_key_issued_at: previousState.billing_key_issued_at,
            retry_count: previousState.retry_count,
            last_payment_error: previousState.last_payment_error,
            cancel_at_period_end: previousState.cancel_at_period_end,
            cancelled_at: previousState.cancelled_at,
            cancelled_reason: previousState.cancelled_reason,
            auto_renew: previousState.auto_renew,
            updated_at: now.toISOString(),
          }).eq("id", subId);
        }
        return { persisted: false, error: `subscription_payments INSERT rollback: ${payError.message}` };
      }
    }

    return { persisted: true, subscriptionId: subId ?? undefined };
  } catch (error) {
    return { persisted: false, error: error instanceof Error ? error.message : "Unknown persistence error" };
  }
}

export async function persistPersonalSubscription(
  db: SupabaseAdmin,
  params: {
    userId: string;
    planId: string;
    portonePaymentId: string;
    amount: number;
  } & PersistOptions,
): Promise<{ persisted: boolean; error?: string }> {
  const normalizedPlanId = normalizePlanId(params.planId);
  const now = new Date();
  const expiresAt = oneMonthLater(now);

  try {
    const { data: existingPayment } = await db
      .from("subscription_payments")
      .select("id")
      .eq("portone_payment_id", params.portonePaymentId)
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      return { persisted: true };
    }

    const { data: existing } = await db
      .from("user_subscriptions")
      .select(
        "id, plan_id, plan_name, status, started_at, expires_at, billing_cycle, billing_key, billing_key_issued_at, retry_count, last_payment_error, cancel_at_period_end, cancelled_at, cancelled_reason, auto_renew",
      )
      .eq("user_id", params.userId)
      .limit(1)
      .maybeSingle();

    const previousState = existing
      ? {
        plan_id: existing.plan_id,
        plan_name: existing.plan_name,
        status: existing.status,
        started_at: existing.started_at,
        expires_at: existing.expires_at,
        billing_cycle: existing.billing_cycle,
        billing_key: existing.billing_key,
        billing_key_issued_at: existing.billing_key_issued_at,
        retry_count: existing.retry_count,
        last_payment_error: existing.last_payment_error,
        cancel_at_period_end: existing.cancel_at_period_end,
        cancelled_at: existing.cancelled_at,
        cancelled_reason: existing.cancelled_reason,
        auto_renew: existing.auto_renew,
      }
      : null;

    const billingKeyIssuedAt = params.billingKey
      ? (existing?.billing_key_issued_at ?? now.toISOString())
      : existing?.billing_key_issued_at;

    const subscriptionData: Record<string, unknown> = {
      plan_id: normalizedPlanId,
      plan_name: normalizedPlanId,
      status: "active",
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      billing_cycle: "monthly",
      retry_count: 0,
      last_payment_error: null,
      cancel_at_period_end: false,
      cancelled_at: null,
      cancelled_reason: null,
      auto_renew: params.autoRenew ?? (params.billingKey ? true : existing?.auto_renew ?? true),
    };

    if (params.billingKey) {
      subscriptionData.billing_key = params.billingKey;
      subscriptionData.billing_key_issued_at = billingKeyIssuedAt;
    }

    const wasInsert = !existing;
    const existingId = existing?.id;

    if (existing) {
      const { error } = await db
        .from("user_subscriptions")
        .update(subscriptionData)
        .eq("id", existing.id);

      if (error) return { persisted: false, error: `user_subscriptions UPDATE: ${error.message}` };
    } else {
      subscriptionData.user_id = params.userId;

      const { error } = await db
        .from("user_subscriptions")
        .insert(subscriptionData);

      if (error) return { persisted: false, error: `user_subscriptions INSERT: ${error.message}` };
    }

    if (params.amount > 0) {
      const periodEnd = oneMonthLater(now);
      const { error: payError } = await db
        .from("subscription_payments")
        .insert({
          user_id: params.userId,
          payment_context: "personal",
          portone_payment_id: params.portonePaymentId,
          amount: params.amount,
          final_amount: params.amount,
          status: "completed",
          payment_method: params.paymentMethod ?? (params.billingKey ? "card_auto" : "card"),
          paid_at: now.toISOString(),
          billing_period_start: now.toISOString().split("T")[0],
          billing_period_end: periodEnd.toISOString().split("T")[0],
        });

      if (payError) {
        if (wasInsert) {
          await db.from("user_subscriptions").delete().eq("user_id", params.userId);
        } else if (previousState && existingId) {
          await db.from("user_subscriptions").update({
            plan_id: previousState.plan_id,
            plan_name: previousState.plan_name,
            status: previousState.status,
            started_at: previousState.started_at,
            expires_at: previousState.expires_at,
            billing_cycle: previousState.billing_cycle,
            billing_key: previousState.billing_key,
            billing_key_issued_at: previousState.billing_key_issued_at,
            retry_count: previousState.retry_count,
            last_payment_error: previousState.last_payment_error,
            cancel_at_period_end: previousState.cancel_at_period_end,
            cancelled_at: previousState.cancelled_at,
            cancelled_reason: previousState.cancelled_reason,
            auto_renew: previousState.auto_renew,
          }).eq("id", existingId);
        }
        return { persisted: false, error: `subscription_payments INSERT rollback: ${payError.message}` };
      }
    }

    return { persisted: true };
  } catch (error) {
    return { persisted: false, error: error instanceof Error ? error.message : "Unknown persistence error" };
  }
}
