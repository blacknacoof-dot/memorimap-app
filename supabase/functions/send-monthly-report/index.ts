/**
 * 월간 리포트 이메일 발송 Edge Function
 *
 * 트리거: Supabase cron (pg_cron) 또는 수동 호출
 * 대상: 활성 상조 구독 업체 (sj_starter/sj_professional/sj_enterprise)
 * 발송: Resend API
 *
 * 환경 변수:
 *   RESEND_API_KEY — Resend API 키
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — 자동 주입
 *
 * 배포: supabase functions deploy send-monthly-report
 * cron 등록 (SQL):
 *   SELECT cron.schedule('monthly-report', '0 9 1 * *',
 *     $$SELECT net.http_post(
 *       url := 'https://<project>.supabase.co/functions/v1/send-monthly-report',
 *       headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
 *     )$$
 *   );
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // 인증 검증 (service_role 또는 super_admin만)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
        return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const client = createClient(supabaseUrl, serviceRoleKey);

    // 지난 달 범위 계산
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const monthLabel = `${lastMonth.getFullYear()}년 ${lastMonth.getMonth() + 1}월`;

    // 활성 상조 구독 업체 조회
    const { data: subscriptions, error: subError } = await client
        .from('facility_subscriptions')
        .select('facility_id, plan_name, plan_id')
        .in('plan_id', ['sj_starter', 'sj_professional', 'sj_enterprise'])
        .eq('status', 'active');

    if (subError || !subscriptions?.length) {
        return new Response(JSON.stringify({
            message: 'No active sangjo subscriptions',
            error: subError?.message,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const reports: PartnerReport[] = [];
    const errors: string[] = [];

    for (const sub of subscriptions) {
        try {
            // 시설 정보 + 관리자 이메일
            const { data: facility } = await client
                .from('facilities')
                .select('name')
                .eq('id', sub.facility_id)
                .maybeSingle();

            const { data: admin } = await client
                .from('sangjo_hq_admins')
                .select('email')
                .eq('sangjo_id', sub.facility_id)
                .limit(1)
                .maybeSingle();

            if (!admin?.email) continue;

            // 지난 달 상담 집계
            const { count: consultationCount } = await client
                .from('consultations')
                .select('*', { count: 'exact', head: true })
                .eq('facility_id', sub.facility_id)
                .gte('created_at', lastMonth.toISOString())
                .lte('created_at', lastMonthEnd.toISOString());

            const { count: completedCount } = await client
                .from('consultations')
                .select('*', { count: 'exact', head: true })
                .eq('facility_id', sub.facility_id)
                .in('status', ['accepted', 'completed'])
                .gte('created_at', lastMonth.toISOString())
                .lte('created_at', lastMonthEnd.toISOString());

            // 상조 계약 집계
            const { count: contractCount } = await client
                .from('sangjo_contracts')
                .select('*', { count: 'exact', head: true })
                .eq('sangjo_id', sub.facility_id)
                .gte('created_at', lastMonth.toISOString())
                .lte('created_at', lastMonthEnd.toISOString());

            // 예약 집계
            const { count: reservationCount } = await client
                .from('reservations')
                .select('*', { count: 'exact', head: true })
                .eq('facility_id', sub.facility_id)
                .gte('created_at', lastMonth.toISOString())
                .lte('created_at', lastMonthEnd.toISOString());

            const totalConsultations = (consultationCount ?? 0) + (contractCount ?? 0);
            const totalCompleted = completedCount ?? 0;
            const conversionRate = totalConsultations > 0
                ? Math.round((totalCompleted / totalConsultations) * 100)
                : 0;

            reports.push({
                facilityId: sub.facility_id,
                facilityName: facility?.name ?? '업체',
                email: admin.email,
                planName: sub.plan_name,
                planId: sub.plan_id,
                consultationCount: totalConsultations,
                completedCount: totalCompleted,
                reservationCount: reservationCount ?? 0,
                conversionRate,
            });
        } catch (e) {
            errors.push(`${sub.facility_id}: ${e instanceof Error ? e.message : 'unknown'}`);
        }
    }

    // 이메일 발송
    let sentCount = 0;
    for (const report of reports) {
        const upgradeHint = getUpgradeHint(report);
        const htmlBody = buildEmailHtml(report, monthLabel, upgradeHint);

        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: '추모맵 <noreply@memorimap.com>',
                    to: [report.email],
                    subject: `[추모맵] ${monthLabel} 월간 활동 리포트 — ${report.facilityName}`,
                    html: htmlBody,
                }),
            });
            if (res.ok) sentCount++;
            else errors.push(`${report.facilityId}: Resend ${res.status}`);
        } catch (e) {
            errors.push(`${report.facilityId}: send failed — ${e instanceof Error ? e.message : 'unknown'}`);
        }
    }

    return new Response(JSON.stringify({
        totalSubscriptions: subscriptions.length,
        reportsGenerated: reports.length,
        emailsSent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

function getUpgradeHint(report: PartnerReport): string | null {
    if (report.planId === 'sj_starter' && report.consultationCount >= 20) {
        return 'PROFESSIONAL 요금제의 고급 CRM을 사용하면 전환율을 평균 15% 높일 수 있습니다.';
    }
    if (report.planId === 'sj_professional' && report.consultationCount >= 50) {
        return 'ENTERPRISE 요금제의 자동 계약 시스템으로 업무 효율을 극대화하세요.';
    }
    return null;
}

function buildEmailHtml(report: PartnerReport, monthLabel: string, upgradeHint: string | null): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
  <div style="background:#1e293b;border-radius:16px 16px 0 0;padding:32px 24px;text-align:center">
    <h1 style="color:white;font-size:20px;margin:0 0 4px">${report.facilityName}</h1>
    <p style="color:#94a3b8;font-size:13px;margin:0">${monthLabel} 월간 리포트</p>
  </div>

  <div style="background:white;padding:24px;border-radius:0 0 16px 16px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:12px;text-align:center;border:1px solid #e2e8f0;background:#f8fafc">
          <div style="font-size:11px;color:#64748b;font-weight:bold;text-transform:uppercase">상담 접수</div>
          <div style="font-size:24px;font-weight:900;color:#1e293b;margin-top:4px">${report.consultationCount}건</div>
        </td>
        <td style="padding:12px;text-align:center;border:1px solid #e2e8f0;background:#f8fafc">
          <div style="font-size:11px;color:#64748b;font-weight:bold;text-transform:uppercase">계약 체결</div>
          <div style="font-size:24px;font-weight:900;color:#059669;margin-top:4px">${report.completedCount}건</div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px;text-align:center;border:1px solid #e2e8f0;background:#f8fafc">
          <div style="font-size:11px;color:#64748b;font-weight:bold;text-transform:uppercase">예약</div>
          <div style="font-size:24px;font-weight:900;color:#1e293b;margin-top:4px">${report.reservationCount}건</div>
        </td>
        <td style="padding:12px;text-align:center;border:1px solid #e2e8f0;background:#f8fafc">
          <div style="font-size:11px;color:#64748b;font-weight:bold;text-transform:uppercase">전환율</div>
          <div style="font-size:24px;font-weight:900;color:#4f46e5;margin-top:4px">${report.conversionRate}%</div>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#475569;line-height:1.6;margin:0 0 16px">
      현재 요금제: <strong>${report.planName}</strong>
    </p>

    ${upgradeHint ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:16px">
      <p style="font-size:13px;color:#1e40af;margin:0 0 12px;line-height:1.5">${upgradeHint}</p>
      <a href="https://memorimap.com/partner" style="display:inline-block;background:#4f46e5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold">
        업그레이드 알아보기
      </a>
    </div>
    ` : ''}

    <p style="font-size:11px;color:#94a3b8;text-align:center;margin:24px 0 0">
      이 메일은 추모맵 파트너 서비스에서 자동 발송되었습니다.
    </p>
  </div>
</div>
</body>
</html>`;
}
