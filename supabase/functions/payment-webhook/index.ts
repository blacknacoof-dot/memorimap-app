import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  persistFacilitySubscription as persistFacilitySubscriptionShared,
  persistPersonalSubscription as persistPersonalSubscriptionShared,
} from "../_shared/subscriptionPersistence.ts";

const PORTONE_API_URL = "https://api.portone.io";

type SupabaseAdmin = ReturnType<typeof createClient>;
type PaymentIntentRow = {
  payment_id: string;
  payment_context: "facility_subscription" | "personal_subscription";
  user_id: string;
  facility_id: string | null;
  plan_id: string;
  expected_amount: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  billing_key?: string | null;
};

async function verifyWebhookSignature(
  body: string,
  headers: Headers,
  secret: string,
): Promise<boolean> {
  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const webhookSignature = headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  const ts = parseInt(webhookTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) {
    return false;
  }

  const secretBytes = Uint8Array.from(
    atob(secret.startsWith("whsec_") ? secret.slice(6) : secret),
    (c) => c.charCodeAt(0),
  );
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signedContent));
  const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return webhookSignature
    .split(" ")
    .some((sig) => {
      const parts = sig.split(",");
      return parts.length === 2 && parts[0] === "v1" && parts[1] === expectedSig;
    });
}

interface PortOnePayment {
  id: string;
  status: string;
  amount?: { total?: number };
  orderName?: string;
}

async function fetchPortOnePayment(
  paymentId: string,
  apiSecret: string,
): Promise<{ payment: PortOnePayment | null; error: string | null }> {
  try {
    const res = await fetch(`${PORTONE_API_URL}/payments/${paymentId}`, {
      headers: {
        Authorization: `PortOne ${apiSecret}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      return { payment: null, error: `PortOne API ${res.status}: ${await res.text()}` };
    }
    return { payment: await res.json() as PortOnePayment, error: null };
  } catch (error) {
    return { payment: null, error: error instanceof Error ? error.message : "fetch failed" };
  }
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
    source: "edge-function:payment-webhook",
  });
}

function normalizePlanId(planId: string): string {
  return planId.trim().replace(/[\s-]+/g, "_").toUpperCase();
}

async function getPaymentIntent(
  db: SupabaseAdmin,
  paymentId: string,
): Promise<PaymentIntentRow | null> {
  const { data, error } = await db
    .from("payment_intents")
    .select("payment_id, payment_context, user_id, facility_id, plan_id, expected_amount, status, billing_key")
    .eq("payment_id", paymentId)
    .limit(1)
    .maybeSingle();

  return error ? null : (data as PaymentIntentRow | null);
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
    .eq("payment_id", paymentId)
    .neq("status", status);
}

async function persistFacilitySubscription(
  db: SupabaseAdmin,
  facilityId: string,
  planId: string,
  portonePaymentId: string,
  amount: number,
): Promise<{ persisted: boolean; error?: string; subscriptionId?: string }> {
  const normalizedPlanId = normalizePlanId(planId);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);
  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  try {
    const { data: existingPayment } = await db
      .from("subscription_payments")
      .select("id, subscription_id")
      .eq("portone_payment_id", portonePaymentId)
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      return { persisted: true, subscriptionId: existingPayment.subscription_id ?? undefined };
    }

    const filterCol = isUUID ? "facility_id_uuid" : "facility_id_bigint";
    const filterVal = isUUID ? facilityId : Number(facilityId);

    const { data: existing } = await db
      .from("facility_subscriptions")
      .select("id, plan_id, status, next_billing_date, billing_cycle")
      .eq(filterCol, filterVal)
      .limit(1)
      .maybeSingle();

    const previousState = existing
      ? {
        plan_id: existing.plan_id,
        status: existing.status,
        next_billing_date: existing.next_billing_date,
        billing_cycle: existing.billing_cycle,
      }
      : null;

    const subscriptionData: Record<string, unknown> = {
      plan_id: normalizedPlanId,
      status: "active",
      next_billing_date: nextBilling.toISOString(),
      updated_at: now.toISOString(),
      billing_cycle: "monthly",
    };

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
        subscriptionData.facility_id_uuid = facilityId;
      } else {
        subscriptionData.facility_id_bigint = Number(facilityId);
        subscriptionData.facility_id = Number(facilityId);
      }
      const { data, error } = await db
        .from("facility_subscriptions")
        .insert(subscriptionData)
        .select("id")
        .single();
      if (error) return { persisted: false, error: `facility_subscriptions INSERT: ${error.message}` };
      subId = data?.id;
    }

    if (subId && amount > 0) {
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: payError } = await db
        .from("subscription_payments")
        .insert({
          subscription_id: subId,
          payment_context: "facility",
          portone_payment_id: portonePaymentId,
          amount,
          final_amount: amount,
          status: "completed",
          payment_method: "card",
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

async function persistPersonalSubscription(
  db: SupabaseAdmin,
  userId: string,
  planId: string,
  portonePaymentId: string,
  amount: number,
): Promise<{ persisted: boolean; error?: string }> {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  try {
    const { data: existingPayment } = await db
      .from("subscription_payments")
      .select("id")
      .eq("portone_payment_id", portonePaymentId)
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      return { persisted: true };
    }

    const { data: existing } = await db
      .from("user_subscriptions")
      .select("id, plan_id, plan_name, status, started_at, expires_at, billing_cycle")
      .eq("user_id", userId)
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
      }
      : null;

    const subscriptionData: Record<string, unknown> = {
      plan_id: planId,
      plan_name: planId,
      status: "active",
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      billing_cycle: "monthly",
    };

    const wasInsert = !existing;
    const existingId = existing?.id;

    if (existing) {
      const { error } = await db
        .from("user_subscriptions")
        .update(subscriptionData)
        .eq("id", existing.id);
      if (error) return { persisted: false, error: `user_subscriptions UPDATE: ${error.message}` };
    } else {
      subscriptionData.user_id = userId;
      const { error } = await db
        .from("user_subscriptions")
        .insert(subscriptionData);
      if (error) return { persisted: false, error: `user_subscriptions INSERT: ${error.message}` };
    }

    if (amount > 0) {
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: payError } = await db
        .from("subscription_payments")
        .insert({
          user_id: userId,
          payment_context: "personal",
          portone_payment_id: portonePaymentId,
          amount,
          final_amount: amount,
          status: "completed",
          payment_method: "card",
          paid_at: now.toISOString(),
          billing_period_start: now.toISOString().split("T")[0],
          billing_period_end: periodEnd.toISOString().split("T")[0],
        });

      if (payError) {
        if (wasInsert) {
          await db.from("user_subscriptions").delete().eq("user_id", userId);
        } else if (previousState && existingId) {
          await db.from("user_subscriptions").update({
            plan_id: previousState.plan_id,
            plan_name: previousState.plan_name,
            status: previousState.status,
            started_at: previousState.started_at,
            expires_at: previousState.expires_at,
            billing_cycle: previousState.billing_cycle,
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

async function handleSubscriptionPaid(
  db: SupabaseAdmin,
  payment: PortOnePayment,
): Promise<{ action: string }> {
  const paymentId = payment.id;
  const amount = payment.amount?.total ?? 0;
  const intent = await getPaymentIntent(db, paymentId);

  if (!intent) {
    await log(db, "WARN", "Webhook received subscription payment without payment_intents", {
      paymentId,
      amount,
      orderName: payment.orderName,
    });
    return { action: "logged:intent_not_found" };
  }

  if (intent.status === "paid") {
    return { action: "skipped:intent_already_paid" };
  }

  if (intent.payment_context === "facility_subscription") {
    if (!intent.facility_id) {
      await log(db, "ERROR", "Facility payment intent missing facility_id", { paymentId });
      return { action: "error:facility_metadata_missing" };
    }

    const persistResult = await persistFacilitySubscriptionShared(db, {
      facilityId: intent.facility_id,
      planId: intent.plan_id,
      portonePaymentId: paymentId,
      amount: amount || intent.expected_amount,
      billingKey: intent.billing_key,
      autoRenew: !!intent.billing_key,
    });

    if (!persistResult.persisted) {
      await log(db, "ERROR", "Facility subscription persistence failed in webhook", {
        paymentId,
        error: persistResult.error,
      });
      return { action: "error:facility_persist_failed" };
    }
  } else {
    const persistResult = await persistPersonalSubscriptionShared(db, {
      userId: intent.user_id,
      planId: intent.plan_id,
      portonePaymentId: paymentId,
      amount: amount || intent.expected_amount,
      billingKey: intent.billing_key,
      autoRenew: !!intent.billing_key,
    });

    if (!persistResult.persisted) {
      await log(db, "ERROR", "Personal subscription persistence failed in webhook", {
        paymentId,
        error: persistResult.error,
      });
      return { action: "error:personal_persist_failed" };
    }
  }

  await updatePaymentIntentStatus(db, paymentId, "paid", payment.status);
  return { action: `synced:${intent.payment_context}` };
}

async function handleReservationPaid(
  db: SupabaseAdmin,
  payment: PortOnePayment,
): Promise<{ action: string }> {
  const paymentId = payment.id;
  const { data: reservation } = await db
    .from("reservations")
    .select("id, payment_verified")
    .eq("payment_id", paymentId)
    .limit(1)
    .maybeSingle();

  if (!reservation) {
    await log(db, "WARN", "Webhook received reservation payment without reservation match", {
      paymentId,
      amount: payment.amount?.total,
    });
    return { action: "logged:reservation_not_found" };
  }

  if (reservation.payment_verified === true) {
    return { action: "skipped:already_verified" };
  }

  const { error } = await db
    .from("reservations")
    .update({
      payment_verified: true,
      paid_at: new Date().toISOString(),
    })
    .eq("id", reservation.id)
    .eq("payment_verified", false);

  if (error) {
    await log(db, "ERROR", "Reservation payment sync failed", {
      paymentId,
      reservationId: reservation.id,
      error: error.message,
    });
    return { action: "error:update_failed" };
  }

  return { action: "synced:reservation_verified" };
}

async function handleCancelled(
  db: SupabaseAdmin,
  payment: PortOnePayment,
): Promise<{ action: string }> {
  const paymentId = payment.id;
  const actions: string[] = [];

  const { data: subPayment } = await db
    .from("subscription_payments")
    .select("id, status, subscription_id, payment_context, user_id")
    .eq("portone_payment_id", paymentId)
    .limit(1)
    .maybeSingle();

  if (subPayment) {
    if (subPayment.status === "refunded" || subPayment.status === "cancelled") {
      actions.push("subscription_payment:skipped");
    } else {
      await db
        .from("subscription_payments")
        .update({ status: "refunded" })
        .eq("id", subPayment.id)
        .neq("status", "refunded");
      actions.push("subscription_payment:refunded");

      if (subPayment.payment_context === "facility" && subPayment.subscription_id) {
        await db
          .from("facility_subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", subPayment.subscription_id)
          .neq("status", "cancelled");
        actions.push("facility_subscription:cancelled");
      }

      if (subPayment.payment_context === "personal" && subPayment.user_id) {
        await db
          .from("user_subscriptions")
          .update({ status: "cancelled" })
          .eq("user_id", subPayment.user_id)
          .neq("status", "cancelled");
        actions.push("user_subscription:cancelled");
      }
    }
  }

  const { data: reservation } = await db
    .from("reservations")
    .select("id, refund_status")
    .eq("payment_id", paymentId)
    .limit(1)
    .maybeSingle();

  if (reservation) {
    await db
      .from("reservations")
      .update({ refund_status: "completed" })
      .eq("id", reservation.id)
      .neq("refund_status", "completed");
    actions.push("reservation:refund_completed");
  }

  const intent = await getPaymentIntent(db, paymentId);
  if (intent) {
    await updatePaymentIntentStatus(db, paymentId, "cancelled", payment.status);
    actions.push("payment_intent:cancelled");
  }

  if (actions.length === 0) {
    actions.push("no_matching_records");
  }

  return { action: actions.join(",") };
}

async function handleFailed(
  db: SupabaseAdmin,
  payment: PortOnePayment,
): Promise<{ action: string }> {
  const intent = await getPaymentIntent(db, payment.id);
  if (intent) {
    await updatePaymentIntentStatus(db, payment.id, "failed", payment.status);
  }

  await log(db, "INFO", "Webhook received failed payment", {
    paymentId: payment.id,
    amount: payment.amount?.total,
    orderName: payment.orderName,
  });

  return { action: "logged:payment_failed" };
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

  const portoneApiSecret = Deno.env.get("PORTONE_API_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!portoneApiSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const body = await req.text();
  const webhookSecret = Deno.env.get("PORTONE_WEBHOOK_SECRET");
  const isDevMode = Deno.env.get("ENVIRONMENT") === "development";

  if (!webhookSecret) {
    if (!isDevMode) {
      await log(db, "ERROR", "Webhook secret missing in production", {});
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    await log(db, "WARN", "Skipping webhook signature verification in development", {});
  } else {
    const valid = await verifyWebhookSignature(body, req.headers, webhookSecret);
    if (!valid) {
      await log(db, "ERROR", "Webhook signature verification failed", {
        webhookId: req.headers.get("webhook-id"),
      });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  let webhookData: { type?: string; data?: { paymentId?: string } };
  try {
    webhookData = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventType = webhookData.type;
  const paymentId = webhookData.data?.paymentId;

  if (!paymentId) {
    await log(db, "INFO", "Ignoring webhook without paymentId", { eventType });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { payment, error: fetchError } = await fetchPortOnePayment(paymentId, portoneApiSecret);
  if (fetchError || !payment) {
    await log(db, "ERROR", "PortOne API fetch failed during webhook", {
      paymentId,
      eventType,
      error: fetchError,
    });
    return new Response(JSON.stringify({ error: "PortOne API unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  let result: { action: string };

  switch (payment.status) {
    case "PAID":
      result = paymentId.startsWith("pay_")
        ? await handleReservationPaid(db, payment)
        : await handleSubscriptionPaid(db, payment);
      break;
    case "CANCELLED":
      result = await handleCancelled(db, payment);
      break;
    case "FAILED":
      result = await handleFailed(db, payment);
      break;
    default:
      await log(db, "INFO", "Ignoring unsupported payment status from webhook", {
        paymentId,
        status: payment.status,
        eventType,
      });
      result = { action: `ignored:status_${payment.status}` };
  }

  await log(db, "INFO", "Webhook processed", {
    paymentId,
    portoneStatus: payment.status,
    eventType,
    action: result.action,
  });

  return new Response(JSON.stringify({ ok: true, action: result.action }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
