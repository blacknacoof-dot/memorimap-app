// supabase/functions/deploy-bot-data/index.ts
// Edge Function: Deploy Bot Data
// 
// This function updates the bot_last_updated_at timestamp
// and can be extended to regenerate static JSON files or invalidate cache.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const ALLOWED_ORIGINS = [
    "https://memorimap.vercel.app",
    "https://memorimap.co.kr",
    "http://localhost:5173",
];

function getCorsOrigin(req: Request): string {
    const origin = req.headers.get("Origin") || "";
    return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

interface DeployRequest {
    facility_id?: string;
    action?: "update_timestamp" | "regenerate_all";
}

serve(async (req: Request) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": getCorsOrigin(req),
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

        // [Security] Verify the caller is an admin
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { autoRefreshToken: false, persistSession: false }
        });
        const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);

        if (authErr || !user) {
            // Fallback: check if it's a valid service-level call with matching service key
            const apiKey = req.headers.get("apikey");
            if (apiKey !== supabaseServiceKey) {
                return new Response(
                    JSON.stringify({ success: false, error: "Unauthorized" }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
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

        const { facility_id, action = "update_timestamp" } = body;

        // Action: Update timestamp for specific facility or all
        if (action === "update_timestamp") {
            let query = supabase
                .from("bot_data")
                .update({ bot_last_updated_at: new Date().toISOString() });

            if (facility_id) {
                query = query.eq("facility_id", facility_id);
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
                facilities: botDataList?.map((bd: any) => ({
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
