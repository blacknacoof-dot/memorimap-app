import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Local frontend validation should work regardless of the deployed ENVIRONMENT value.
const ALLOWED_ORIGINS = [...PRODUCTION_ORIGINS, ...DEV_ORIGINS];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin");
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || "")
    ? origin
    : PRODUCTION_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

type SupabaseAdmin = ReturnType<typeof createClient>;
type PaymentIntentContext = "facility_subscription" | "personal_subscription";

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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { userId: verifiedUserId, error: authError } = await verifyJWT(token);
  if (authError || !verifiedUserId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
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
      paymentId,
      paymentContext,
      expectedAmount,
      facilityId,
      planId,
      orderName,
      targetUserId,
    }: {
      paymentId?: string;
      paymentContext?: PaymentIntentContext;
      expectedAmount?: number;
      facilityId?: string;
      planId?: string;
      orderName?: string;
      targetUserId?: string;
    } = await req.json();

    if (!paymentId || !paymentContext || !planId || typeof expectedAmount !== "number") {
      return new Response(JSON.stringify({ error: "paymentId, paymentContext, planId, expectedAmount are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planCheck = await verifySubscriptionPlan(db, planId);
    if (!planCheck.valid || planCheck.price == null || planCheck.price !== expectedAmount) {
      return new Response(JSON.stringify({ error: "Invalid subscription plan or amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (paymentContext === "facility_subscription") {
      if (!facilityId) {
        return new Response(JSON.stringify({ error: "facilityId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const owned = await verifyFacilityOwnership(db, facilityId, verifiedUserId);
      if (!owned) {
        return new Response(JSON.stringify({ error: "Facility ownership verification failed" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (paymentContext === "personal_subscription" && targetUserId && targetUserId !== verifiedUserId) {
      return new Response(JSON.stringify({ error: "Target user mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existing, error: selectError } = await db
      .from("payment_intents")
      .select("id, payment_context, user_id, facility_id, plan_id, expected_amount, status")
      .eq("payment_id", paymentId)
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error("internal error", selectError);

      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existing) {
      const sameIntent =
        existing.payment_context === paymentContext &&
        existing.user_id === verifiedUserId &&
        existing.facility_id === (facilityId ?? null) &&
        existing.plan_id === planId &&
        existing.expected_amount === expectedAmount;

      if (!sameIntent) {
        return new Response(JSON.stringify({ error: "Payment intent already exists with different metadata" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, status: existing.status, alreadyExists: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertError } = await db
      .from("payment_intents")
      .insert({
        payment_id: paymentId,
        payment_context: paymentContext,
        user_id: verifiedUserId,
        facility_id: facilityId ?? null,
        plan_id: planId,
        expected_amount: expectedAmount,
        order_name: orderName ?? null,
        status: "pending",
      });

    if (insertError) {
      console.error("internal error", insertError);

      return new Response(JSON.stringify({ error: "Payment processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, status: "pending" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("internal error", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
