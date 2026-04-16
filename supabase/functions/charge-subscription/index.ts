import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  persistFacilitySubscription,
  persistPersonalSubscription,
  type SupabaseAdmin,
} from "../_shared/subscriptionPersistence.ts";

const PORTONE_API_URL = "https://api.portone.io";

function generateServerPaymentId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${prefix}_${ts}_${rand}`.slice(0, 40);
}

async function log(
  db: SupabaseAdmin,
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  meta: Record<string, unknown>,
): Promise<void> {
  await db.from("system_logs").insert({
    level,
    message,
    meta,
    source: "edge-function:charge-subscription",
  });
}

async function updatePaymentIntentStatus(
  db: SupabaseAdmin,
  paymentId: string,
  status: "paid" | "failed" | "cancelled",
  portoneStatus: string,
): Promise<void> {
  await db
    .from("payment_intents")
    .update({
      status,
      portone_status: portoneStatus,
      resolved_at: new Date().toISOString(),
    })
    .eq("payment_id", paymentId);
}

async function chargeWithBillingKey(params: {
  apiSecret: string;
  paymentId: string;
  billingKey: string;
  orderName: string;
  amount: number;
  customerId: string;
}): Promise<boolean> {
  const response = await fetch(`${PORTONE_API_URL}/payments/${params.paymentId}/billing-key`, {
    method: "POST",
    headers: {
      Authorization: `PortOne ${params.apiSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      billingKey: params.billingKey,
      orderName: params.orderName,
      amount: { total: params.amount },
      currency: "KRW",
      customer: {
        id: params.customerId,
      },
    }),
  });

  return response.ok;
}

async function fetchPayment(
  apiSecret: string,
  paymentId: string,
): Promise<{ status: string; amount?: { total?: number } } | null> {
  const response = await fetch(`${PORTONE_API_URL}/payments/${paymentId}`, {
    headers: {
      Authorization: `PortOne ${apiSecret}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json() as { status: string; amount?: { total?: number } };
}

async function markFacilityFailure(
  db: SupabaseAdmin,
  subscriptionId: string,
  retryCount: number,
  message: string,
): Promise<void> {
  const nextRetryCount = retryCount + 1;
  const update: Record<string, unknown> = {
    retry_count: nextRetryCount,
    last_payment_error: message,
    updated_at: new Date().toISOString(),
  };

  if (nextRetryCount >= 3) {
    update.status = "expired";
    update.auto_renew = false;
  }

  await db.from("facility_subscriptions").update(update).eq("id", subscriptionId);
}

async function markUserFailure(
  db: SupabaseAdmin,
  userId: string,
  retryCount: number,
  message: string,
): Promise<void> {
  const nextRetryCount = retryCount + 1;
  const update: Record<string, unknown> = {
    retry_count: nextRetryCount,
    last_payment_error: message,
    updated_at: new Date().toISOString(),
  };

  if (nextRetryCount >= 3) {
    update.status = "expired";
    update.auto_renew = false;
  }

  await db.from("user_subscriptions").update(update).eq("user_id", userId);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const portoneApiSecret = Deno.env.get("PORTONE_API_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !portoneApiSecret) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const nowIso = new Date().toISOString();

  const { data: facilitySubs } = await db
    .from("facility_subscriptions")
    .select("id, facility_id_uuid, facility_id_bigint, plan_id, billing_key, next_billing_date, retry_count, status, auto_renew")
    .eq("status", "active")
    .eq("auto_renew", true)
    .not("billing_key", "is", null)
    .lte("next_billing_date", nowIso);

  const { data: userSubs } = await db
    .from("user_subscriptions")
    .select("user_id, plan_id, billing_key, expires_at, retry_count, status, auto_renew")
    .eq("status", "active")
    .eq("auto_renew", true)
    .not("billing_key", "is", null)
    .lte("expires_at", nowIso);

  const results: Array<Record<string, unknown>> = [];

  for (const sub of facilitySubs ?? []) {
    const paymentId = generateServerPaymentId("rsubf");
    const facilityId = String(sub.facility_id_uuid || sub.facility_id_bigint || "");
    const planId = String(sub.plan_id || "");
    const amountRes = await db.from("subscription_plans").select("price").eq("name_en", planId).limit(1).maybeSingle();
    const amount = typeof amountRes.data?.price === "number" ? amountRes.data.price : null;

    if (!facilityId || !planId || !sub.billing_key || amount == null || amount <= 0) {
      await markFacilityFailure(db, sub.id, sub.retry_count ?? 0, "Missing recurring billing metadata");
      results.push({ scope: "facility", facilityId, status: "skipped_invalid" });
      continue;
    }

    await db.from("payment_intents").upsert({
      payment_id: paymentId,
      payment_context: "facility_subscription",
      user_id: facilityId,
      facility_id: facilityId,
      plan_id: planId,
      expected_amount: amount,
      order_name: `[추모맵] ${planId} 정기결제`,
      status: "pending",
      billing_key: sub.billing_key,
    }, { onConflict: "payment_id" });

    const charged = await chargeWithBillingKey({
      apiSecret: portoneApiSecret,
      paymentId,
      billingKey: sub.billing_key,
      orderName: `[추모맵] ${planId} 정기결제`,
      amount,
      customerId: facilityId,
    });

    const payment = charged ? await fetchPayment(portoneApiSecret, paymentId) : null;
    if (!charged || payment?.status !== "PAID" || payment.amount?.total !== amount) {
      await updatePaymentIntentStatus(db, paymentId, "failed", payment?.status || "FAILED");
      await markFacilityFailure(db, sub.id, sub.retry_count ?? 0, "Recurring facility charge failed");
      results.push({ scope: "facility", facilityId, status: "failed" });
      continue;
    }

    const persistResult = await persistFacilitySubscription(db, {
      facilityId,
      planId,
      portonePaymentId: paymentId,
      amount,
      billingKey: sub.billing_key,
      autoRenew: true,
    });

    if (!persistResult.persisted) {
      await log(db, "ERROR", "Facility recurring persistence failed", {
        paymentId,
        facilityId,
        error: persistResult.error,
      });
      results.push({ scope: "facility", facilityId, status: "persist_failed" });
      continue;
    }

    await updatePaymentIntentStatus(db, paymentId, "paid", payment.status);
    results.push({ scope: "facility", facilityId, status: "paid", paymentId });
  }

  for (const sub of userSubs ?? []) {
    const paymentId = generateServerPaymentId("rsubp");
    const planId = String(sub.plan_id || "");
    const amountRes = await db.from("subscription_plans").select("price").eq("name_en", planId).limit(1).maybeSingle();
    const amount = typeof amountRes.data?.price === "number" ? amountRes.data.price : null;

    if (!sub.user_id || !planId || !sub.billing_key || amount == null || amount <= 0) {
      await markUserFailure(db, sub.user_id, sub.retry_count ?? 0, "Missing recurring billing metadata");
      results.push({ scope: "personal", userId: sub.user_id, status: "skipped_invalid" });
      continue;
    }

    await db.from("payment_intents").upsert({
      payment_id: paymentId,
      payment_context: "personal_subscription",
      user_id: sub.user_id,
      facility_id: null,
      plan_id: planId,
      expected_amount: amount,
      order_name: `[추모맵] ${planId} 정기결제`,
      status: "pending",
      billing_key: sub.billing_key,
    }, { onConflict: "payment_id" });

    const charged = await chargeWithBillingKey({
      apiSecret: portoneApiSecret,
      paymentId,
      billingKey: sub.billing_key,
      orderName: `[추모맵] ${planId} 정기결제`,
      amount,
      customerId: sub.user_id,
    });

    const payment = charged ? await fetchPayment(portoneApiSecret, paymentId) : null;
    if (!charged || payment?.status !== "PAID" || payment.amount?.total !== amount) {
      await updatePaymentIntentStatus(db, paymentId, "failed", payment?.status || "FAILED");
      await markUserFailure(db, sub.user_id, sub.retry_count ?? 0, "Recurring personal charge failed");
      results.push({ scope: "personal", userId: sub.user_id, status: "failed" });
      continue;
    }

    const persistResult = await persistPersonalSubscription(db, {
      userId: sub.user_id,
      planId,
      portonePaymentId: paymentId,
      amount,
      billingKey: sub.billing_key,
      autoRenew: true,
    });

    if (!persistResult.persisted) {
      await log(db, "ERROR", "Personal recurring persistence failed", {
        paymentId,
        userId: sub.user_id,
        error: persistResult.error,
      });
      results.push({ scope: "personal", userId: sub.user_id, status: "persist_failed" });
      continue;
    }

    await updatePaymentIntentStatus(db, paymentId, "paid", payment.status);
    results.push({ scope: "personal", userId: sub.user_id, status: "paid", paymentId });
  }

  return new Response(JSON.stringify({
    success: true,
    processed: results.length,
    results,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
