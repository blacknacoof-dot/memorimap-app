import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rateLimit.ts";
import {
  persistFacilitySubscription,
  persistPersonalSubscription,
  type SupabaseAdmin,
} from "../_shared/subscriptionPersistence.ts";
import { normalizeKcpReviewFields, upsertPaymentAudit } from "../_shared/paymentAudit.ts";

const PORTONE_API_URL = "https://api.portone.io";

const PRODUCTION_ORIGINS = [
  "https://memorimap.kr",
  "https://www.memorimap.kr",
  "https://memorimap-app.vercel.app",
  "https://memorimap-app-ptys-projects.vercel.app",
];

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

const ALLOWED_ORIGINS = [...PRODUCTION_ORIGINS, ...DEV_ORIGINS];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin");
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || "") ? origin : PRODUCTION_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

async function verifyJWT(token: string): Promise<{ userId: string | null; error: string | null }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return { userId: null, error: "Supabase not configured" };
  }

  try {
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    if (error || !user) {
      return { userId: null, error: error?.message || "Invalid or expired token" };
    }

    return { userId: user.id, error: null };
  } catch (error) {
    return { userId: null, error: error instanceof Error ? error.message : "Token verification failed" };
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
    source: "edge-function:issue-billing-key",
  });
}

async function verifySubscriptionPlan(
  db: SupabaseAdmin,
  planId: string,
): Promise<{ valid: boolean; price: number | null }> {
  const { data, error } = await db
    .from("subscription_plans")
    .select("name_en, price, is_active")
    .eq("name_en", planId)
    .limit(1)
    .maybeSingle();

  if (error || !data || data.is_active === false) {
    return { valid: false, price: null };
  }

  return { valid: true, price: typeof data.price === "number" ? data.price : null };
}

async function verifyFacilityOwnership(
  db: SupabaseAdmin,
  facilityId: string,
  verifiedUserId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from("facilities")
    .select("user_id")
    .eq("id", facilityId)
    .maybeSingle();

  if (!error && data && data.user_id === verifiedUserId) {
    return true;
  }

  const { data: adminData, error: adminError } = await db
    .from("sangjo_hq_admins")
    .select("id")
    .eq("sangjo_id", facilityId)
    .eq("user_id", verifiedUserId)
    .limit(1)
    .maybeSingle();

  return !adminError && !!adminData;
}

function generateServerPaymentId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${prefix}_${ts}_${rand}`.slice(0, 40);
}

async function upsertPaymentIntent(
  db: SupabaseAdmin,
  params: {
    paymentId: string;
    paymentContext: "facility_subscription" | "personal_subscription";
    userId: string;
    facilityId?: string;
    planId: string;
    expectedAmount: number;
    orderName: string;
    billingKey: string;
  },
): Promise<void> {
  await db.from("payment_intents").upsert({
    payment_id: params.paymentId,
    payment_context: params.paymentContext,
    user_id: params.userId,
    facility_id: params.facilityId ?? null,
    plan_id: params.planId,
    expected_amount: params.expectedAmount,
    order_name: params.orderName,
    status: "pending",
    billing_key: params.billingKey,
  }, { onConflict: "payment_id" });
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

async function findRecentActivationAttempt(
  db: SupabaseAdmin,
  params: {
    paymentContext: "facility_subscription" | "personal_subscription";
    userId: string;
    facilityId?: string;
    planId: string;
    billingKey: string;
    createdAfterIso: string;
  },
): Promise<{ payment_id: string; status: string } | null> {
  let query = db
    .from("payment_intents")
    .select("payment_id, status, created_at")
    .eq("payment_context", params.paymentContext)
    .eq("user_id", params.userId)
    .eq("plan_id", params.planId)
    .eq("billing_key", params.billingKey)
    .gte("created_at", params.createdAfterIso)
    .order("created_at", { ascending: false })
    .limit(1);

  query = params.facilityId
    ? query.eq("facility_id", params.facilityId)
    : query.is("facility_id", null);

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    return null;
  }

  return {
    payment_id: data.payment_id,
    status: data.status,
  };
}

async function chargeWithBillingKey(params: {
  apiSecret: string;
  paymentId: string;
  billingKey: string;
  orderName: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
  customerId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const customer: Record<string, unknown> = {};
  if (params.customerId) customer.id = params.customerId;
  if (params.customerName) customer.name = { full: params.customerName };
  if (params.customerEmail) customer.email = params.customerEmail;
  if (params.customerPhoneNumber) customer.phoneNumber = params.customerPhoneNumber;

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
      ...(Object.keys(customer).length > 0 ? { customer } : {}),
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    let detail = raw;
    try {
      const parsed = JSON.parse(raw) as { message?: string; code?: string; type?: string };
      detail = parsed.message || parsed.code || parsed.type || raw;
    } catch {
      // Keep raw text when the upstream body is not JSON.
    }
    return { ok: false, error: `PortOne billing charge failed (${response.status}): ${detail}` };
  }

  return { ok: true };
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

async function deleteBillingKey(apiSecret: string, billingKey: string): Promise<void> {
  await fetch(`${PORTONE_API_URL}/billing-keys/${billingKey}`, {
    method: "DELETE",
    headers: {
      Authorization: `PortOne ${apiSecret}`,
      "Content-Type": "application/json",
    },
  });
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!authHeader || !token || token === authHeader.trim()) {
    return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { userId: verifiedUserId, error: authError } = await verifyJWT(token);
  if (authError || !verifiedUserId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rateLimitResult = await rateLimit(req, {
    endpoint: "issue-billing-key",
    maxRequests: 10,
    windowSeconds: 60,
    userId: verifiedUserId,
  });

  if (!rateLimitResult.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(rateLimitResult.retryAfterSeconds ?? 60),
      },
    });
  }

  const portoneApiSecret = Deno.env.get("PORTONE_API_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = (Deno.env.get("MEMORIMAP_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

  if (!portoneApiSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const {
      billingKey,
      planId,
      paymentContext,
      facilityId,
      targetUserId,
      customerName,
      customerEmail,
      customerPhoneNumber,
      orderName,
    }: {
      billingKey?: string;
      planId?: string;
      paymentContext?: "facility_subscription" | "personal_subscription";
      facilityId?: string;
      targetUserId?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhoneNumber?: string;
      orderName?: string;
    } = await req.json();

    if (!billingKey || !planId || !paymentContext) {
      return new Response(JSON.stringify({ error: "billingKey, planId, paymentContext are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (paymentContext === "facility_subscription" && !facilityId) {
      return new Response(JSON.stringify({ error: "facilityId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (paymentContext === "personal_subscription" && targetUserId && targetUserId !== verifiedUserId) {
      return new Response(JSON.stringify({ error: "Target user mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planCheck = await verifySubscriptionPlan(db, planId);
    if (!planCheck.valid || planCheck.price == null || planCheck.price <= 0) {
      return new Response(JSON.stringify({ error: "Invalid subscription plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (paymentContext === "facility_subscription") {
      const owned = await verifyFacilityOwnership(db, facilityId!, verifiedUserId);
      if (!owned) {
        return new Response(JSON.stringify({ error: "Facility ownership verification failed" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const duplicateWindowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const recentAttempt = await findRecentActivationAttempt(db, {
      paymentContext,
      userId: verifiedUserId,
      facilityId,
      planId,
      billingKey,
      createdAfterIso: duplicateWindowStart,
    });

    if (recentAttempt?.status === "paid") {
      return new Response(JSON.stringify({
        success: true,
        paymentId: recentAttempt.payment_id,
        deduplicated: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (recentAttempt?.status === "pending" || recentAttempt?.status === "sync_required") {
      await log(db, "WARN", "Duplicate recurring activation attempt blocked", {
        paymentContext,
        planId,
        billingKey,
        facilityId: facilityId ?? null,
        requestedBy: verifiedUserId,
        existingPaymentId: recentAttempt.payment_id,
      });

      return new Response(JSON.stringify({ error: "Activation already in progress" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentId = generateServerPaymentId(paymentContext === "facility_subscription" ? "rsubf" : "rsubp");
    const resolvedOrderName = orderName || `[추모맵] ${planId} 정기결제 시작`;

    await upsertPaymentIntent(db, {
      paymentId,
      paymentContext,
      userId: verifiedUserId,
      facilityId,
      planId,
      expectedAmount: planCheck.price,
      orderName: resolvedOrderName,
      billingKey,
    });

    const chargeResult = await chargeWithBillingKey({
      apiSecret: portoneApiSecret,
      paymentId,
      billingKey,
      orderName: resolvedOrderName,
      amount: planCheck.price,
      customerName,
      customerEmail,
      customerPhoneNumber,
      customerId: paymentContext === "facility_subscription" ? facilityId : verifiedUserId,
    });

    if (!chargeResult.ok) {
      const failedReviewFields = normalizeKcpReviewFields({
        payment: { status: "FAILED" },
        expectedAmount: planCheck.price,
        requestedPayMethod: "CARD",
      });
      await upsertPaymentAudit(db, {
        paymentId,
        paymentContext,
        source: "edge-function:issue-billing-key",
        reviewFields: failedReviewFields,
      });
      await updatePaymentIntentStatus(db, paymentId, "failed", "FAILED");
      await deleteBillingKey(portoneApiSecret, billingKey);

      return new Response(JSON.stringify({ error: chargeResult.error || "Initial recurring charge failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = await fetchPayment(portoneApiSecret, paymentId);
    const kcpReviewFields = normalizeKcpReviewFields({
      payment,
      expectedAmount: planCheck.price,
      requestedPayMethod: "CARD",
    });
    await upsertPaymentAudit(db, {
      paymentId,
      paymentContext,
      source: "edge-function:issue-billing-key",
      reviewFields: kcpReviewFields,
    });
    if (kcpReviewFields.missingFields.length > 0) {
      await log(db, "WARN", "KCP review fields incomplete during initial recurring activation", {
        paymentId,
        paymentContext,
        missingFields: kcpReviewFields.missingFields,
        resCd: kcpReviewFields.resCd,
        tno: kcpReviewFields.tno,
        payMethod: kcpReviewFields.payMethod,
      });
    }
    const isPaid = payment?.status === "PAID";
    const isAmountValid = payment?.amount?.total === planCheck.price;

    if (!payment) {
      await updatePaymentIntentStatus(db, paymentId, "pending", "VERIFY_PENDING");
      await log(db, "WARN", "Initial recurring charge verification deferred", {
        paymentId,
        paymentContext,
        planId,
        expectedAmount: planCheck.price,
        actualAmount: null,
        status: "VERIFY_PENDING",
      });

      return new Response(JSON.stringify({
        error: "Initial recurring charge verification pending",
        paymentId,
        recoverable: true,
      }), {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isPaid || !isAmountValid) {
      const finalFailure = payment.status === "FAILED" || payment.status === "CANCELLED";
      await updatePaymentIntentStatus(
        db,
        paymentId,
        finalFailure ? "failed" : "sync_required",
        !isAmountValid ? "AMOUNT_MISMATCH" : payment.status || "UNKNOWN",
      );
      await log(db, finalFailure ? "ERROR" : "WARN", "Initial recurring charge verification requires recovery", {
        paymentId,
        paymentContext,
        planId,
        expectedAmount: planCheck.price,
        actualAmount: payment.amount?.total,
        status: payment.status,
      });

      if (finalFailure) {
        await deleteBillingKey(portoneApiSecret, billingKey);
      }

      return new Response(JSON.stringify({
        error: finalFailure ? "Initial recurring charge verification failed" : "Initial recurring charge requires reconciliation",
        paymentId,
        recoverable: !finalFailure,
      }), {
        status: finalFailure ? 502 : 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (paymentContext === "facility_subscription") {
      const persistResult = await persistFacilitySubscription(db, {
        facilityId: facilityId!,
        planId,
        portonePaymentId: paymentId,
        amount: planCheck.price,
        billingKey,
        autoRenew: true,
      });

      if (!persistResult.persisted) {
        await updatePaymentIntentStatus(db, paymentId, "sync_required", "SYNC_REQUIRED");
        await log(db, "ERROR", "Facility recurring activation persistence failed", {
          paymentId,
          facilityId,
          error: persistResult.error,
        });

        return new Response(JSON.stringify({
          error: persistResult.error || "Subscription persistence pending recovery",
          paymentId,
          recoverable: true,
        }), {
          status: 202,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await updatePaymentIntentStatus(db, paymentId, "paid", payment.status);
      return new Response(JSON.stringify({
        success: true,
        paymentId,
        subscriptionId: persistResult.subscriptionId,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const persistResult = await persistPersonalSubscription(db, {
      userId: verifiedUserId,
      planId,
      portonePaymentId: paymentId,
      amount: planCheck.price,
      billingKey,
      autoRenew: true,
    });

    if (!persistResult.persisted) {
      await updatePaymentIntentStatus(db, paymentId, "sync_required", "SYNC_REQUIRED");
      await log(db, "ERROR", "Personal recurring activation persistence failed", {
        paymentId,
        error: persistResult.error,
      });

      return new Response(JSON.stringify({
        error: persistResult.error || "Subscription persistence pending recovery",
        paymentId,
        recoverable: true,
      }), {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await updatePaymentIntentStatus(db, paymentId, "paid", payment.status);
    return new Response(JSON.stringify({ success: true, paymentId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("internal error", error);
    return new Response(JSON.stringify({ error: "Initial recurring subscription setup failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
