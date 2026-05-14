import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { handleSendMonthlyReportRequest } from "./core.ts";

serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = (Deno.env.get("MEMORIMAP_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const dryRun = Deno.env.get("SEND_MONTHLY_REPORT_DRY_RUN") === "true";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Supabase env not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = createClient(supabaseUrl, serviceRoleKey);
  return await handleSendMonthlyReportRequest(req, client, {
    serviceRoleKey,
    resendApiKey,
    dryRun,
  });
});
