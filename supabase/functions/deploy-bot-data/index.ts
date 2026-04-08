// supabase/functions/deploy-bot-data/index.ts
// Edge Function: Deploy Bot Data
// 
// This function updates the bot_last_updated_at timestamp
// and can be extended to regenerate static JSON files or invalidate cache.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { parseFacilityIdentifier, type FacilityIdentifier } from "./facilityId.ts";

const PRODUCTION_ORIGINS = [
    "https://memorimap.kr",
    "https://www.memorimap.kr",
    "https://memorimap-app.vercel.app",
    "https://memorimap-app-ptys-projects.vercel.app",
];

// 개발 환경에서만 localhost 허용 (ENVIRONMENT=development 설정 시)
const DEV_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
];

const isDevMode = Deno.env.get("ENVIRONMENT") === "development";
const ALLOWED_ORIGINS = isDevMode
    ? [...PRODUCTION_ORIGINS, ...DEV_ORIGINS]
    : PRODUCTION_ORIGINS;

function getCorsOrigin(req: Request): string {
    const origin = req.headers.get("Origin") || "";
    return ALLOWED_ORIGINS.includes(origin) ? origin : PRODUCTION_ORIGINS[0];
}

interface DeployRequest {
    facility_id?: string;
    action?: "update_timestamp" | "regenerate_all";
}

/**
 * facility_id contract
 *
 * This function intentionally supports only the production contracts that currently
 * exist in bot_data:
 * - legacy number string: regular funeral/memorial facilities matched via facilities.legacy_id
 * - sangjo UUID string: sangjo organizations matched via facilities.id where type = 'sangjo'
 *
 * Plain UUIDs for non-sangjo facilities are not accepted here.
 */
function validateDeployRequest(body: DeployRequest): { ok: true; value: DeployRequest } | { ok: false; error: string } {
    const action = body.action ?? "update_timestamp";

    if (!["update_timestamp", "regenerate_all"].includes(action)) {
        return { ok: false, error: "action must be update_timestamp or regenerate_all" };
    }

    if (body.facility_id !== undefined && typeof body.facility_id !== "string") {
        return { ok: false, error: "facility_id must be a string" };
    }

    return {
        ok: true,
        value: {
            action,
            facility_id: body.facility_id?.trim() || undefined,
        },
    };
}

async function requireExistingLegacyFacility(
    supabase: ReturnType<typeof createClient>,
    facilityId: number,
): Promise<boolean> {
    const { data, error } = await supabase
        .from("facilities")
        .select("id")
        .eq("legacy_id", facilityId)
        .limit(1)
        .maybeSingle();

    return !error && !!data;
}

async function requireExistingSangjoFacility(
    supabase: ReturnType<typeof createClient>,
    facilityId: string,
): Promise<boolean> {
    const { data, error } = await supabase
        .from("facilities")
        .select("id")
        .eq("id", facilityId)
        .eq("type", "sangjo")
        .limit(1)
        .maybeSingle();

    return !error && !!data;
}

async function isNonSangjoFacilityUuid(
    supabase: ReturnType<typeof createClient>,
    facilityId: string,
): Promise<boolean> {
    const { data, error } = await supabase
        .from("facilities")
        .select("id, type")
        .eq("id", facilityId)
        .limit(1)
        .maybeSingle();

    return !error && !!data && data.type !== "sangjo";
}

async function canManageLegacyFacility(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    facilityId: number,
): Promise<boolean> {
    const { data, error } = await supabase
        .from("facilities")
        .select("id")
        .eq("legacy_id", facilityId)
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

    return !error && !!data;
}

async function canManageSangjoFacility(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    facilityId: string,
): Promise<boolean> {
    const { data: ownedSangjo, error: sangjoError } = await supabase
        .from("sangjo_hq_admins")
        .select("id")
        .eq("sangjo_id", facilityId)
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

    return !sangjoError && !!ownedSangjo;
}

async function requireExistingFacility(
    supabase: ReturnType<typeof createClient>,
    facilityId: FacilityIdentifier,
): Promise<boolean> {
    if (facilityId.type === "legacy") {
        return requireExistingLegacyFacility(supabase, facilityId.value);
    }

    return requireExistingSangjoFacility(supabase, facilityId.value);
}

async function canManageFacility(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    facilityId: FacilityIdentifier,
): Promise<boolean> {
    if (facilityId.type === "legacy") {
        return canManageLegacyFacility(supabase, userId, facilityId.value);
    }

    return canManageSangjoFacility(supabase, userId, facilityId.value);
}

serve(async (req: Request) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": getCorsOrigin(req),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Credentials": "true",
    };

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // [Security] Verify authorization
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing authorization" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Initialize Supabase client with service role
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // [Security] JWT 인증 — Supabase Auth 네이티브 검증
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { autoRefreshToken: false, persistSession: false }
        });
        const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);

        if (authErr || !user) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // [Security] 관리자 권한 확인 (super_admin 또는 facility_admin만 허용)
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("clerk_id", user.id)
            .single();

        if (!profile || !["super_admin", "facility_admin", "admin"].includes(profile.role)) {
            return new Response(
                JSON.stringify({ success: false, error: "Forbidden: admin access required" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse request body
        let body: DeployRequest = {};
        if (req.method === "POST") {
            try {
                body = await req.json();
            } catch {
                body = {};
            }
        }

        const validatedRequest = validateDeployRequest(body);
        if (!validatedRequest.ok) {
            return new Response(
                JSON.stringify({ success: false, error: validatedRequest.error }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { facility_id, action } = validatedRequest.value;
        const isSuperAdmin = profile.role === "super_admin";
        let parsedFacilityId: FacilityIdentifier | null = null;

        if (action === "regenerate_all" && !isSuperAdmin) {
            return new Response(
                JSON.stringify({ success: false, error: "Forbidden: super admin access required" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (action === "update_timestamp" && facility_id !== undefined) {
            const parsed = parseFacilityIdentifier(facility_id);
            if (!parsed.ok) {
                return new Response(
                    JSON.stringify({ success: false, error: parsed.error }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            parsedFacilityId = parsed.identifier;

            if (parsed.identifier.type === "sangjo") {
                const isWrongUuidContract = await isNonSangjoFacilityUuid(supabase, parsed.identifier.value);
                if (isWrongUuidContract) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: "facility_id contract mismatch: non-sangjo facilities must use legacy numeric IDs",
                        }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }
            }

            const facilityExists = await requireExistingFacility(supabase, parsed.identifier);
            if (!facilityExists) {
                return new Response(
                    JSON.stringify({ success: false, error: "facility_id does not exist" }),
                    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        if (action === "update_timestamp" && !isSuperAdmin) {
            if (!parsedFacilityId) {
                return new Response(
                    JSON.stringify({ success: false, error: "facility_id is required for facility admins" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const canManage = await canManageFacility(supabase, user.id, parsedFacilityId);
            if (!canManage) {
                return new Response(
                    JSON.stringify({ success: false, error: "Forbidden: facility ownership required" }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // Action: Update timestamp for specific facility or all
        if (action === "update_timestamp") {
            let query = supabase
                .from("bot_data")
                .update({ bot_last_updated_at: new Date().toISOString() });

            if (parsedFacilityId) {
                // bot_data.facility_id intentionally remains mixed in production data.
                // The function boundary normalizes the contract so ownership checks and updates
                // use the same identifier that bot_data stores today.
                query = query.eq("facility_id", parsedFacilityId.value);
            }

            const { data, error } = await query.select();

            if (error) {
                console.error("Error updating bot_data:", error);
                return new Response(
                    JSON.stringify({ success: false, error: error.message }),
                    {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                );
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message: `Updated ${data?.length || 0} bot_data records`,
                    updated_at: new Date().toISOString(),
                    data,
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        // Action: Regenerate all (future implementation)
        if (action === "regenerate_all") {
            // 1. Fetch all bot_data
            const { data: botDataList, error: fetchError } = await supabase
                .from("bot_data")
                .select(`
          *,
          facilities (
            id,
            name,
            address,
            phone,
            type
          )
        `);

            if (fetchError) {
                return new Response(
                    JSON.stringify({ success: false, error: fetchError.message }),
                    {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                );
            }

            // 2. Generate static JSON (placeholder for future Storage upload)
            const staticData = {
                generated_at: new Date().toISOString(),
                facilities: botDataList?.map((bd: Record<string, unknown> & { facility_id?: string; facilities?: { name?: string }; welcome_message?: string; faq_items?: unknown; ai_context?: unknown }) => ({
                    facility_id: bd.facility_id,
                    name: bd.facilities?.name,
                    welcome_message: bd.welcome_message,
                    faq_items: bd.faq_items,
                    ai_context: bd.ai_context,
                })),
            };

            // 3. Update all timestamps
            await supabase
                .from("bot_data")
                .update({ bot_last_updated_at: new Date().toISOString() });

            // Future: Upload to Storage
            // await supabase.storage.from('bot-cache').upload('data.json', JSON.stringify(staticData));

            return new Response(
                JSON.stringify({
                    success: true,
                    message: `Regenerated data for ${botDataList?.length || 0} facilities`,
                    static_data: staticData,
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        // Invalid action
        return new Response(
            JSON.stringify({ success: false, error: "Invalid action" }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );

    } catch (error) {
        console.error("Edge function error:", error);
        return new Response(
            JSON.stringify({ success: false, error: String(error) }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
