import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  persistFacilitySubscription,
  persistPersonalSubscription,
  type SupabaseAdmin,
} from "../_shared/subscriptionPersistence.ts";

const PORTONE_API_URL = "https://api.portone.io";

type PaymentIntentRow = {
  payment_id: string;
  payment_context: "facility_subscription" | "personal_subscription";
  user_id: string;
  facility_id: string | null;
  plan_id: string;
  expected_amount: number;
  status: "pending" | "sync_required" | "paid" | "failed" | "cancelled";
  billing_key?: string | null;
};

type PortOnePayment = {
  id: string;
  status: string;
  amount?: { total?: number };
  orderName?: string;
};

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
    source: "edge-function:reconcile-payment-intent",
  });
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
  status: "pending" | "sync_required" | "paid" | "failed" | "cancelled",
  portoneStatus: string,
): Promise<void> {
  await db
    .from("payment_intents")
    .update({
      status,
      portone_status: portoneStatus,
      resolved_at: status === "pending" || status === "sync_required" ? null : new Date().toISOString(),
    })
    .eq("payment_id", paymentId);
}

async function fetchPortOnePayment(
  paymentId: string,
  apiSecret: string,
): Promise<{ payment: PortOnePayment | null; error: string | null }> {
  try {
    const response = await fetch(`${PORTONE_API_URL}/payments/${paymentId}`, {
      headers: {
        Authorization: `PortOne ${apiSecret}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return { payment: null, error: `PortOne API ${response.status}: ${await response.text()}` };
    }

    return { payment: await response.json() as PortOnePayment, error: null };
  } catch (error) {
    return { payment: null, error: error instanceof Error ? error.message : "fetch failed" };
  }
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

  try {
    const { paymentId }: { paymentId?: string } = await req.json();

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "paymentId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const intent = await getPaymentIntent(db, paymentId);
    if (!intent) {
      return new Response(JSON.stringify({ error: "Payment intent not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (intent.status === "paid") {
      return new Response(JSON.stringify({
        success: true,
        paymentId,
        status: "paid",
        reconciled: false,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { payment, error } = await fetchPortOnePayment(paymentId, portoneApiSecret);
    if (error || !payment) {
      await log(db, "ERROR", "Manual payment intent reconciliation fetch failed", {
        paymentId,
        error: error || "PortOne payment not found",
      });
      return new Response(JSON.stringify({ error: "Failed to fetch PortOne payment status" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (payment.status === "FAILED") {
      await updatePaymentIntentStatus(db, paymentId, "failed", payment.status);
      return new Response(JSON.stringify({
        success: true,
        paymentId,
        status: "failed",
        reconciled: true,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (payment.status === "CANCELLED") {
      await updatePaymentIntentStatus(db, paymentId, "cancelled", payment.status);
      return new Response(JSON.stringify({
        success: true,
        paymentId,
        status: "cancelled",
        reconciled: true,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (payment.status !== "PAID") {
      await updatePaymentIntentStatus(db, paymentId, "pending", payment.status || "VERIFY_PENDING");
      return new Response(JSON.stringify({
        success: true,
        paymentId,
        status: "pending",
        portoneStatus: payment.status,
        reconciled: false,
      }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    }

    const amount = payment.amount?.total ?? 0;
    if (amount !== intent.expected_amount) {
      await updatePaymentIntentStatus(db, paymentId, "sync_required", "AMOUNT_MISMATCH");
      await log(db, "WARN", "Manual payment intent reconciliation detected amount mismatch", {
        paymentId,
        expectedAmount: intent.expected_amount,
        actualAmount: amount,
      });
      return new Response(JSON.stringify({
        error: "Amount mismatch requires manual review",
        paymentId,
        status: "sync_required",
      }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (intent.payment_context === "facility_subscription" && !intent.facility_id) {
      await updatePaymentIntentStatus(db, paymentId, "sync_required", "FACILITY_METADATA_MISSING");
      await log(db, "ERROR", "Manual payment intent reconciliation missing facility metadata", {
        paymentId,
        paymentContext: intent.payment_context,
      });
      return new Response(JSON.stringify({
        error: "Facility metadata missing",
        paymentId,
        status: "sync_required",
      }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const persistResult = intent.payment_context === "facility_subscription"
      ? await persistFacilitySubscription(db, {
        facilityId: intent.facility_id!,
        planId: intent.plan_id,
        portonePaymentId: paymentId,
        amount,
        billingKey: intent.billing_key,
        autoRenew: !!intent.billing_key,
      })
      : await persistPersonalSubscription(db, {
        userId: intent.user_id,
        planId: intent.plan_id,
        portonePaymentId: paymentId,
        amount,
        billingKey: intent.billing_key,
        autoRenew: !!intent.billing_key,
      });

    if (!persistResult.persisted) {
      await updatePaymentIntentStatus(db, paymentId, "sync_required", "SYNC_REQUIRED");
      await log(db, "ERROR", "Manual payment intent reconciliation persistence failed", {
        paymentId,
        paymentContext: intent.payment_context,
        error: persistResult.error,
      });
      return new Response(JSON.stringify({
        error: persistResult.error || "Persistence failed",
        paymentId,
        status: "sync_required",
      }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    await updatePaymentIntentStatus(db, paymentId, "paid", payment.status);
    await log(db, "INFO", "Manual payment intent reconciliation completed", {
      paymentId,
      paymentContext: intent.payment_context,
      portoneStatus: payment.status,
    });

    return new Response(JSON.stringify({
      success: true,
      paymentId,
      status: "paid",
      reconciled: true,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("manual reconcile error", error);
    return new Response(JSON.stringify({ error: "Manual payment intent reconciliation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
