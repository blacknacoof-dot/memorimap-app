/**
 * Monthly sangjo report Edge Function
 *
 * Triggered by Supabase cron.
 * Sends a report to each active sangjo HQ admin based on the
 * current month's consultations, contracts, and reservations.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PartnerReport {
    facilityId: string;
    facilityName: string;
    email: string;
    planName: string;
    planId: string;
    consultationCount: number;
    completedCount: number;
    reservationCount: number;
    conversionRate: number;
}

serve(async (req: Request) => {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
        return new Response(JSON.stringify({ error: "Supabase env not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    const authHeader = req.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!bearerToken || bearerToken !== serviceRoleKey) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!resendApiKey) {
        return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    const client = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const monthLabel = `${lastMonth.getFullYear()}년 ${lastMonth.getMonth() + 1}월`;

    const { data: subscriptions, error: subError } = await client
        .from("facility_subscriptions")
        .select("facility_id, plan_name, plan_id")
        .in("plan_id", ["sj_starter", "sj_professional", "sj_enterprise"])
        .eq("status", "active");

    if (subError || !subscriptions?.length) {
        return new Response(JSON.stringify({
            message: "No active sangjo subscriptions",
            error: subError?.message,
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    const reports: PartnerReport[] = [];
    const errors: string[] = [];

    for (const sub of subscriptions) {
        try {
            const { data: facility } = await client
                .from("facilities")
                .select("name")
                .eq("id", sub.facility_id)
                .maybeSingle();

            const { data: admin } = await client
                .from("sangjo_hq_admins")
                .select("user_id")
                .eq("sangjo_id", sub.facility_id)
                .limit(1)
                .maybeSingle();

            if (!admin?.user_id) continue;

            const { data: profile } = await client
                .from("profiles")
                .select("email")
                .eq("clerk_id", admin.user_id)
                .maybeSingle();

            if (!profile?.email) continue;

            const { count: consultationCount } = await client
                .from("consultations")
                .select("*", { count: "exact", head: true })
                .eq("facility_id", sub.facility_id)
                .gte("created_at", lastMonth.toISOString())
                .lte("created_at", lastMonthEnd.toISOString());

            const { count: completedCount } = await client
                .from("consultations")
                .select("*", { count: "exact", head: true })
                .eq("facility_id", sub.facility_id)
                .in("status", ["accepted", "completed"])
                .gte("created_at", lastMonth.toISOString())
                .lte("created_at", lastMonthEnd.toISOString());

            const { count: contractCount } = await client
                .from("sangjo_contracts")
                .select("*", { count: "exact", head: true })
                .eq("sangjo_id", sub.facility_id)
                .gte("created_at", lastMonth.toISOString())
                .lte("created_at", lastMonthEnd.toISOString());

            const { count: reservationCount } = await client
                .from("reservations")
                .select("*", { count: "exact", head: true })
                .eq("facility_id", sub.facility_id)
                .gte("created_at", lastMonth.toISOString())
                .lte("created_at", lastMonthEnd.toISOString());

            const totalConsultations = (consultationCount ?? 0) + (contractCount ?? 0);
            const totalCompleted = completedCount ?? 0;
            const conversionRate = totalConsultations > 0
                ? Math.round((totalCompleted / totalConsultations) * 100)
                : 0;

            reports.push({
                facilityId: sub.facility_id,
                facilityName: facility?.name ?? "상조 업체",
                email: profile.email,
                planName: sub.plan_name ?? sub.plan_id,
                planId: sub.plan_id,
                consultationCount: totalConsultations,
                completedCount: totalCompleted,
                reservationCount: reservationCount ?? 0,
                conversionRate,
            });
        } catch (e) {
            errors.push(`${sub.facility_id}: ${e instanceof Error ? e.message : "unknown"}`);
        }
    }

    let sentCount = 0;
    for (const report of reports) {
        const upgradeHint = getUpgradeHint(report);
        const htmlBody = buildEmailHtml(report, monthLabel, upgradeHint);

        try {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "memorimap<noreply@memorimap.com>",
                    to: [report.email],
                    subject: `[memorimap] ${monthLabel} 월간 리포트 - ${report.facilityName}`,
                    html: htmlBody,
                }),
            });

            if (res.ok) sentCount++;
            else errors.push(`${report.facilityId}: Resend ${res.status}`);
        } catch (e) {
            errors.push(`${report.facilityId}: send failed ${e instanceof Error ? e.message : "unknown"}`);
        }
    }

    return new Response(JSON.stringify({
        totalSubscriptions: subscriptions.length,
        reportsGenerated: reports.length,
        emailsSent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
    }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
});

function getUpgradeHint(report: PartnerReport): string | null {
    if (report.planId === "sj_starter" && report.consultationCount >= 20) {
        return "PROFESSIONAL 요금제로 전환하면 상담 처리 효율을 더 높일 수 있습니다.";
    }

    if (report.planId === "sj_professional" && report.consultationCount >= 50) {
        return "ENTERPRISE 요금제를 검토할 시점입니다. 예약 자동화와 운영 분산에 유리합니다.";
    }

    return null;
}

function buildEmailHtml(report: PartnerReport, monthLabel: string, upgradeHint: string | null): string {
    const hintBlock = upgradeHint
        ? `<div style="margin-top:20px;padding:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;color:#1e3a8a;font-size:14px;line-height:1.6">${upgradeHint}</div>`
        : "";

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px">
    <div style="background:#0f172a;color:#fff;border-radius:20px 20px 0 0;padding:28px 24px;text-align:center">
      <h1 style="margin:0;font-size:22px;line-height:1.3">${report.facilityName}</h1>
      <p style="margin:8px 0 0;font-size:13px;color:#cbd5e1">${monthLabel} 월간 리포트</p>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 20px 20px;padding:24px">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr>
          <td style="padding:12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:center">
            <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">상담 건수</div>
            <div style="font-size:28px;font-weight:900;color:#0f172a;margin-top:6px">${report.consultationCount}</div>
          </td>
          <td style="padding:12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:center">
            <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">완료 건수</div>
            <div style="font-size:28px;font-weight:900;color:#16a34a;margin-top:6px">${report.completedCount}</div>
          </td>
          <td style="padding:12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:center">
            <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">예약 건수</div>
            <div style="font-size:28px;font-weight:900;color:#2563eb;margin-top:6px">${report.reservationCount}</div>
          </td>
        </tr>
      </table>
      <div style="font-size:14px;color:#334155;line-height:1.7">
        <p style="margin:0 0 8px">전환율: <strong>${report.conversionRate}%</strong></p>
        <p style="margin:0">현재 플랜: <strong>${report.planName}</strong></p>
      </div>
      ${hintBlock}
    </div>
  </div>
</body>
</html>`;
}
